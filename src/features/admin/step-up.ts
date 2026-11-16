import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { LOCK_WINDOW_MS } from "./step-up-rules";

export { STEP_UP_HOURS, isStepUpFresh, stepUpLockedUntil } from "./step-up-rules";

/** Quando esta sessão confirmou o 2FA no painel (ou null). Plataforma: dono do banco, sem papel. */
export async function getStepUp(sessionId: string): Promise<Date | null> {
  const rows = await getDb().execute<{ verified_at: string | Date }>(
    sql`select verified_at from admin_step_up where session_id = ${sessionId}`,
  );
  return rows[0] ? new Date(rows[0].verified_at) : null;
}

export async function recordStepUp(sessionId: string, userId: string): Promise<void> {
  await getDb().execute(
    sql`insert into admin_step_up (session_id, user_id) values (${sessionId}, ${userId})
        on conflict (session_id) do update set verified_at = now(), user_id = excluded.user_id`,
  );
}

/** Erros de código nos últimos 15 min (linhas step_up_failed do registro do painel). */
export async function recentFailures(userId: string, now = new Date()): Promise<Date[]> {
  const since = new Date(now.getTime() - LOCK_WINDOW_MS).toISOString();
  const rows = await getDb().execute<{ created_at: string | Date }>(
    sql`select created_at from admin_audit_log
        where user_id = ${userId} and action = 'step_up_failed' and created_at > ${since}`,
  );
  return rows.map((r) => new Date(r.created_at));
}

/**
 * Uma tentativa de código por vez para cada admin. Sem isso, várias requisições em paralelo passam pela
 * checagem da trava (5 erros em 15 min) antes de qualquer erro ser gravado. `try` em vez de esperar:
 * quem chega com outra tentativa em curso recebe "ocupado" na hora, sem segurar conexão do banco.
 * Retorna null quando a vaga está ocupada.
 */
export async function withStepUpSlot<T>(userId: string, fn: () => Promise<T>): Promise<T | null> {
  return getDb().transaction(async (tx) => {
    const rows = await tx.execute<{ ok: boolean }>(
      sql`select pg_try_advisory_xact_lock(hashtext(${`admin_step_up:${userId}`})) as ok`,
    );
    if (!rows[0]?.ok) return null;
    return fn();
  });
}

/** Outras sessões abertas desta conta (fora a atual), ainda válidas. */
export async function countOtherSessions(userId: string, sessionId: string): Promise<number> {
  const rows = await getDb().execute<{ n: number }>(
    sql`select count(*)::int as n from session where "userId" = ${userId} and id <> ${sessionId} and "expiresAt" > now()`,
  );
  return rows[0]?.n ?? 0;
}

/** Encerra as outras sessões (o step-up delas cai junto, por cascade). Sem cache de sessão no cookie: vale na hora. */
export async function deleteOtherSessions(userId: string, sessionId: string): Promise<number> {
  const rows = await getDb().execute<{ id: string }>(
    sql`delete from session where "userId" = ${userId} and id <> ${sessionId} returning id`,
  );
  return rows.length;
}
