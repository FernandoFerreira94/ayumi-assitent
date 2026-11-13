import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

const DAY = 86_400_000;
/** Registro de acesso: 6 meses exigidos pelo Marco Civil + folga. */
export const ACCESS_LOG_DAYS = 200;
/** Conversas do WhatsApp: 12 meses (política de privacidade). */
export const MESSAGE_DAYS = 365;

/** Limpeza diária (worker). Rotina de plataforma: roda como dono do banco, em todos os estúdios. */
export async function runRetention(now = new Date()): Promise<{ accessLogs: number; messages: number }> {
  const db = getDb();
  const logs = await db.execute(
    sql`delete from access_log where created_at < ${new Date(now.getTime() - ACCESS_LOG_DAYS * DAY).toISOString()} returning id`,
  );
  const msgs = await db.execute(
    sql`delete from messages where created_at < ${new Date(now.getTime() - MESSAGE_DAYS * DAY).toISOString()} returning id`,
  );
  return { accessLogs: logs.length, messages: msgs.length };
}
