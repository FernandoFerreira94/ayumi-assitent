import "server-only";
import { sql } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { googleCalendar, GoogleApiError, GoogleAuthError, refreshAccessToken, type CalendarPort } from "./calendar";
import { syncAppointment, type SyncResult } from "./sync";

type AccountRow = { id: string; accessToken: string | null; refreshToken: string | null; expiresAt: Date | null };

/** Conta Google do dono do estúdio (a agenda é dele). */
async function ownerGoogleAccount(tenantId: string): Promise<AccountRow | null> {
  const rows = await getDb().execute<AccountRow>(sql`
    select a.id, a."accessToken" as "accessToken", a."refreshToken" as "refreshToken",
           a."accessTokenExpiresAt" as "expiresAt"
    from account a join memberships m on m.user_id = a."userId"
    where m.tenant_id = ${tenantId} and m.role = 'owner' and a."providerId" = 'google'
    limit 1`);
  return rows[0] ?? null;
}

/** Token de acesso do Google do estúdio, renovando quando preciso. Null = Google não conectado. */
export async function googleAccessToken(tenantId: string): Promise<string | null> {
  const acc = await ownerGoogleAccount(tenantId);
  if (!acc || (!acc.accessToken && !acc.refreshToken)) return null;
  let token = acc.accessToken;
  const stale = !token || (acc.expiresAt && acc.expiresAt.getTime() < Date.now() + 60_000);
  if (stale) {
    if (!acc.refreshToken) throw new GoogleAuthError("sem refresh token");
    const fresh = await refreshAccessToken(
      acc.refreshToken,
      process.env.GOOGLE_CLIENT_ID ?? "",
      process.env.GOOGLE_CLIENT_SECRET ?? "",
    );
    token = fresh.accessToken;
    await getDb().execute(
      sql`update account set "accessToken" = ${fresh.accessToken}, "accessTokenExpiresAt" = ${fresh.expiresAt.toISOString()}, "updatedAt" = now() where id = ${acc.id}`,
    );
  }
  return token!;
}

/** Porta do Google Agenda do estúdio. Null = Google não conectado. */
export async function calendarForTenant(tenantId: string): Promise<CalendarPort | null> {
  const token = await googleAccessToken(tenantId);
  return token ? googleCalendar(token) : null;
}

/** Versão para as Server Actions: nunca lança. */
export async function syncAppointmentSafe(tenantId: string, appointmentId: string): Promise<SyncResult> {
  try {
    const port = await calendarForTenant(tenantId);
    return await withTenant(tenantId, (tx) => syncAppointment(tx, port, appointmentId));
  } catch (e) {
    return e instanceof GoogleAuthError ? "auth" : e instanceof GoogleApiError ? "failed" : "failed";
  }
}

export async function isGoogleConnected(tenantId: string): Promise<boolean> {
  const acc = await ownerGoogleAccount(tenantId);
  return !!acc && !!(acc.accessToken || acc.refreshToken);
}
