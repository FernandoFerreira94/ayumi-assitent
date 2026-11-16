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
