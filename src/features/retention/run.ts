import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
// Verificação do 2FA no painel do dono: depois da validade (7 dias) a linha não serve para nada.
import { STEP_UP_HOURS as ADMIN_STEP_UP_HOURS } from "@/features/admin/step-up-rules";

const DAY = 86_400_000;
/** Registro de acesso: 6 meses exigidos pelo Marco Civil + folga. */
export const ACCESS_LOG_DAYS = 200;
/** Conversas do WhatsApp: 12 meses (política de privacidade). */
export const MESSAGE_DAYS = 365;
/** Registro de acesso ao painel do dono: 12 meses. */
export const ADMIN_AUDIT_DAYS = 365;

/** Limpeza diária (worker). Rotina de plataforma: roda como dono do banco, em todos os estúdios. */
export async function runRetention(
  now = new Date(),
): Promise<{ accessLogs: number; messages: number; adminAudit: number; adminStepUp: number }> {
  const db = getDb();
  const before = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const logs = await db.execute(sql`delete from access_log where created_at < ${before(ACCESS_LOG_DAYS * DAY)} returning id`);
  const msgs = await db.execute(sql`delete from messages where created_at < ${before(MESSAGE_DAYS * DAY)} returning id`);
  const audit = await db.execute(
    sql`delete from admin_audit_log where created_at < ${before(ADMIN_AUDIT_DAYS * DAY)} returning id`,
  );
  const stepUp = await db.execute(
    sql`delete from admin_step_up where verified_at < ${before(ADMIN_STEP_UP_HOURS * 3_600_000)} returning session_id`,
  );
  return { accessLogs: logs.length, messages: msgs.length, adminAudit: audit.length, adminStepUp: stepUp.length };
}
