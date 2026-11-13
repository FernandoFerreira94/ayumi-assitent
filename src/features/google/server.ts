import "server-only";
import { sql } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import {
  revokeToken,
  googleCalendar,
  googleCalendarReader,
  GoogleApiError,
  GoogleAuthError,
  refreshAccessToken,
  type CalendarPort,
} from "./calendar";
import { readToken, writeToken } from "./token-crypto";
import { importGoogleEvents } from "./import";
import { syncAppointment, type SyncResult } from "./sync";

type AccountRow = {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | string | null;
};

/** Conta Google do dono do estúdio (a agenda é dele). */
async function ownerGoogleAccount(tenantId: string): Promise<AccountRow | null> {
  const rows = await getDb().execute<AccountRow>(sql`
    select a.id, a."accessToken" as "accessToken", a."refreshToken" as "refreshToken",
           a."accessTokenExpiresAt" as "expiresAt"
    from account a join memberships m on m.user_id = a."userId"
    where m.tenant_id = ${tenantId} and m.role = 'owner' and a."providerId" = 'google'
    limit 1`);
  const row = rows[0];
  if (!row) return null;
  return { ...row, accessToken: await readToken(row.accessToken), refreshToken: await readToken(row.refreshToken) };
}

/** Token de acesso do Google do estúdio, renovando quando preciso. Null = Google não conectado. */
export async function googleAccessToken(tenantId: string): Promise<string | null> {
  const acc = await ownerGoogleAccount(tenantId);
  if (!acc || (!acc.accessToken && !acc.refreshToken)) return null;
  let token = acc.accessToken;
  const stale = !token || (acc.expiresAt && new Date(acc.expiresAt).getTime() < Date.now() + 60_000);
  if (stale) {
    if (!acc.refreshToken) throw new GoogleAuthError("sem refresh token");
    const fresh = await refreshAccessToken(
      acc.refreshToken,
      process.env.GOOGLE_CLIENT_ID ?? "",
      process.env.GOOGLE_CLIENT_SECRET ?? "",
    );
    token = fresh.accessToken;
    await getDb().execute(
      sql`update account set "accessToken" = ${await writeToken(fresh.accessToken)}, "accessTokenExpiresAt" = ${fresh.expiresAt.toISOString()}, "updatedAt" = now() where id = ${acc.id}`,
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
    console.error("google_sync_failed", { appointmentId, error: e instanceof Error ? e.message : String(e) });
    return e instanceof GoogleAuthError ? "auth" : "failed";
  }
}

export async function isGoogleConnected(tenantId: string): Promise<boolean> {
  const acc = await ownerGoogleAccount(tenantId);
  return !!acc && !!(acc.accessToken || acc.refreshToken);
}

/** Janela importada: um pouco do passado (histórico do mês) e ~6 meses à frente. */
const PAST_DAYS = 14;
const FUTURE_DAYS = 180;
/** Não bate no Google a cada tela: no máximo uma vez por intervalo, por estúdio. */
const MIN_INTERVAL_MS = 2 * 60_000;
const lastImport = new Map<string, number>();

/**
 * Traz os eventos que já existem no Google Agenda para a agenda do app (somente leitura).
 * Nunca lança: sem Google ou com falha, a agenda segue só com o que há no app.
 */
export async function importExternalEvents(tenantId: string, force = false): Promise<void> {
  const last = lastImport.get(tenantId) ?? 0;
  if (!force && Date.now() - last < MIN_INTERVAL_MS) return;
  lastImport.set(tenantId, Date.now());
  try {
    const token = await googleAccessToken(tenantId);
    if (!token) return;
    const day = 86_400_000;
    const from = new Date(Date.now() - PAST_DAYS * day);
    const to = new Date(Date.now() + FUTURE_DAYS * day);
    await withTenant(tenantId, (tx) => importGoogleEvents(tx, tenantId, googleCalendarReader(token), from, to));
  } catch (e) {
    lastImport.delete(tenantId); // tenta de novo na próxima tela
    console.error("google_import_failed", { error: e instanceof Error ? e.message : String(e) });
  }
}

/** Revoga no Google o acesso de uma pessoa (excluir conta). Nunca lança: a exclusão segue mesmo sem rede. */
export async function revokeGoogleOfUser(userId: string): Promise<void> {
  const rows = await getDb().execute<{ refresh: string | null; access: string | null }>(sql`
    select "refreshToken" as refresh, "accessToken" as access from account
    where "userId" = ${userId} and "providerId" = 'google'`);
  for (const r of rows) {
    const token = (await readToken(r.refresh).catch(() => null)) ?? (await readToken(r.access).catch(() => null));
    if (token) await revokeToken(token).catch(() => undefined);
  }
}
