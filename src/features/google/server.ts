import "server-only";
import { eq, sql } from "drizzle-orm";
import { appointments } from "@/db/schema";
import { getDb, withTenant } from "@/db/client";
import {
  revokeToken,
  googleCalendar,
  googleCalendarReader,
  GoogleAuthError,
  refreshAccessToken,
  type CalendarPort,
} from "./calendar";
import { readToken, writeToken } from "./token-crypto";
import { importGoogleEvents } from "./import";
import { syncAppointment, type SyncResult } from "./sync";

type AccountRow = {
  id: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | string | null;
};

/**
 * Conta Google da profissional: a do login ligado a ela (`memberships.professional_id`). Profissional sem login,
 * ou com login sem Google, devolve null (não sincroniza, sem erro). Dona sem profissional ligada (cadastro novo)
 * vale para a profissional padrão do salão, a mesma que recebe a agenda quando ninguém escolhe.
 * A padrão vem de `first_professional_of` (SECURITY DEFINER, só leitura), pois isto roda sem salão ativo e `professionals` tem FORCE RLS.
 */
export async function professionalGoogleAccount(professionalId: string): Promise<AccountRow | null> {
  const rows = await getDb().execute<AccountRow>(sql`
    select a.id, a."userId" as "userId", a."accessToken" as "accessToken", a."refreshToken" as "refreshToken",
           a."accessTokenExpiresAt" as "expiresAt"
    from account a join memberships m on m.user_id = a."userId"
    where a."providerId" = 'google' and (
      m.professional_id = ${professionalId}
      or (m.professional_id is null and m.role = 'owner' and ${professionalId}::uuid = first_professional_of(m.tenant_id))
    )
    order by (m.professional_id is not null) desc
    limit 1`);
  const row = rows[0];
  if (!row) return null;
  return { ...row, accessToken: await readToken(row.accessToken), refreshToken: await readToken(row.refreshToken) };
}

/** Token de acesso do Google da profissional, renovando quando preciso. Null = Google não conectado. */
export async function googleAccessToken(professionalId: string): Promise<string | null> {
  const acc = await professionalGoogleAccount(professionalId);
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

/** Porta do Google Agenda da profissional. Null = Google não conectado. */
export async function calendarForProfessional(professionalId: string): Promise<CalendarPort | null> {
  const token = await googleAccessToken(professionalId);
  return token ? googleCalendar(token) : null;
}

/**
 * Versão para as Server Actions: nunca lança. A agenda Google é a da profissional do atendimento
 * (lida do próprio atendimento, não de quem pediu); sem Google ligado a ela, "skipped".
 */
export async function syncAppointmentSafe(tenantId: string, appointmentId: string): Promise<SyncResult> {
  try {
    const [row] = await withTenant(tenantId, (tx) =>
      tx
        .select({ professionalId: appointments.professionalId })
        .from(appointments)
        .where(eq(appointments.id, appointmentId)),
    );
    if (!row) return "skipped";
    const port = await calendarForProfessional(row.professionalId);
    return await withTenant(tenantId, (tx) => syncAppointment(tx, port, appointmentId));
  } catch (e) {
    console.error("google_sync_failed", { appointmentId, error: e instanceof Error ? e.message : String(e) });
    return e instanceof GoogleAuthError ? "auth" : "failed";
  }
}

export async function isGoogleConnected(professionalId: string): Promise<boolean> {
  const acc = await professionalGoogleAccount(professionalId);
  return !!acc && !!(acc.accessToken || acc.refreshToken);
}

/** Profissionais do salão com Google ligado (quem tem login com conta Google; a dona sem vínculo vale pela padrão). */
export async function connectedProfessionalIds(tenantId: string): Promise<string[]> {
  const rows = await getDb().execute<{ id: string }>(sql`
    select distinct coalesce(m.professional_id, first_professional_of(m.tenant_id)) as id
    from memberships m join account a on a."userId" = m.user_id
    where m.tenant_id = ${tenantId} and a."providerId" = 'google'
      and (m.professional_id is not null or m.role = 'owner')`);
  return rows.map((r) => r.id).filter(Boolean);
}

/** Janela importada: um pouco do passado (histórico do mês) e ~6 meses à frente. */
const PAST_DAYS = 14;
const FUTURE_DAYS = 180;
/** Não bate no Google a cada tela: no máximo uma vez por intervalo, por estúdio. */
const MIN_INTERVAL_MS = 2 * 60_000;
const lastImport = new Map<string, number>();

/**
 * Traz os eventos que já existem no Google Agenda de cada profissional conectada para a agenda do app
 * (somente leitura), cada um no bloqueio da própria profissional.
 * Nunca lança: sem Google ou com falha, a agenda segue só com o que há no app.
 */
export async function importExternalEvents(tenantId: string, force = false): Promise<void> {
  const last = lastImport.get(tenantId) ?? 0;
  if (!force && Date.now() - last < MIN_INTERVAL_MS) return;
  lastImport.set(tenantId, Date.now());
  try {
    const day = 86_400_000;
    const from = new Date(Date.now() - PAST_DAYS * day);
    const to = new Date(Date.now() + FUTURE_DAYS * day);
    const ids = await connectedProfessionalIds(tenantId);
    const results = await Promise.all(
      ids.map(async (professionalId) => {
        try {
          const token = await googleAccessToken(professionalId);
          if (!token) return true;
          await withTenant(tenantId, (tx) =>
            importGoogleEvents(tx, tenantId, professionalId, googleCalendarReader(token), from, to),
          );
          return true;
        } catch (e) {
          console.error("google_import_failed", { error: e instanceof Error ? e.message : String(e) });
          return false;
        }
      }),
    );
    if (results.includes(false)) lastImport.delete(tenantId); // tenta de novo na próxima tela
  } catch (e) {
    lastImport.delete(tenantId);
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
