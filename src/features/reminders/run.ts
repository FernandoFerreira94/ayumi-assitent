import "server-only";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { sendReminders, type ReminderRun } from "./core";
import { sendNudges } from "./nudge";

/** Uma rodada para todos os estúdios. Erros de um estúdio não param os outros. */
export async function runReminders(
  portFor: (instance: string) => MessagingPort | null,
  now = new Date(),
  fallbackInstance?: string,
): Promise<ReminderRun> {
  const all = await getDb().select({ id: tenants.id, instance: tenants.whatsappInstance }).from(tenants);
  const total: ReminderRun = { sent: 0, failed: 0, offline: false };
  for (const t of all) {
    const instance = t.instance ?? fallbackInstance;
    const port = instance ? portFor(instance) : null;
    if (!port) continue; // estúdio sem WhatsApp conectado
    try {
      const r = await withTenant(t.id, (tx) => sendReminders(tx, port, now));
      // Reforço único de confirmação (mesma rodada de 5 min); falha aqui não derruba o lembrete
      const n = await withTenant(t.id, (tx) => sendNudges(tx, port, now)).catch((e) => {
        console.error(JSON.stringify({ level: "warn", msg: "nudge_tenant_failed", tenant: t.id, err: String(e) }));
        return { sent: 0, failed: 0, offline: false };
      });
      r.sent += n.sent;
      r.failed += n.failed;
      r.offline ||= n.offline;
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
