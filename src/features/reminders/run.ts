import "server-only";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { sendReminders, type ReminderRun } from "./core";

/** Uma rodada para todos os estúdios. Erros de um estúdio não param os outros. */
export async function runReminders(port: MessagingPort, now = new Date()): Promise<ReminderRun> {
  const all = await getDb().select({ id: tenants.id }).from(tenants);
  const total: ReminderRun = { sent: 0, failed: 0, offline: false };
  for (const t of all) {
    try {
      const r = await withTenant(t.id, (tx) => sendReminders(tx, port, now));
      total.sent += r.sent;
      total.failed += r.failed;
      total.offline ||= r.offline;
    } catch (e) {
      console.error(JSON.stringify({ level: "error", msg: "reminders_tenant_failed", tenant: t.id, err: String(e) }));
      total.failed++;
    }
  }
  return total;
}
