import "server-only";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { sendPendingReplies } from "@/features/messaging/pending";
import { sendDueCancelNotices } from "@/features/messaging/cancel-send";
import { sendDueDepositNotices } from "@/features/messaging/deposit-send";
import { sendDueRescheduleNotices } from "@/features/messaging/reschedule-send";
import type { PushPort } from "@/features/push/port";
import { getReminderSettings, sendReminders, type ReminderRun } from "./core";
import { notifyNoReplies } from "./no-reply";
import { sendNudges } from "./nudge";
import { errCode } from "@/lib/log";

/**
 * Uma rodada para todos os estúdios: 1º aviso, 2º aviso, respostas guardadas da noite e, com `push`, o aviso à dona de quem não respondeu.
 * Erros de um estúdio não param os outros.
 */
export async function runReminders(
  portFor: (instance: string) => MessagingPort | null,
  now = new Date(),
  push: PushPort | null = null,
): Promise<ReminderRun> {
  const all = await getDb().select({ id: tenants.id, instance: tenants.whatsappInstance }).from(tenants);
  const total: ReminderRun = { sent: 0, failed: 0, offline: false };
  for (const t of all) {
    // Só a instância do próprio estúdio: nunca enviar pelo WhatsApp de outro salão
    const port = t.instance ? portFor(t.instance) : null;
    if (!port) continue; // estúdio sem WhatsApp conectado
    try {
      // Avisos de remarcação que a tela não mandou (app fechado no Desfazer, nova tentativa): antes do lembrete,
      // porque o aviso dentro da janela já vale como 1º aviso
      const rs = await withTenant(t.id, (tx) => sendDueRescheduleNotices(tx, t.id, port, now)).catch((e) => {
        console.error(JSON.stringify({ level: "warn", msg: "reschedule_tenant_failed", tenant: t.id, ...errCode(e) }));
        return { sent: 0, failed: 0 };
      });
      // Avisos de cancelamento (a dona deixou "Avisar a cliente" ligado), depois do Desfazer
      const cs = await withTenant(t.id, (tx) => sendDueCancelNotices(tx, t.id, port, now)).catch((e) => {
        console.error(JSON.stringify({ level: "warn", msg: "cancel_tenant_failed", tenant: t.id, ...errCode(e) }));
        return { sent: 0, failed: 0 };
      });
      // Sinal recebido (a dona deixou "Avisar a cliente" ligado), depois do Desfazer: antes do 1º aviso, que então
      // sai só como lembrete (o horário ficou confirmado)
      const ds = await withTenant(t.id, (tx) => sendDueDepositNotices(tx, t.id, port, now)).catch((e) => {
        console.error(JSON.stringify({ level: "warn", msg: "deposit_tenant_failed", tenant: t.id, ...errCode(e) }));
        return { sent: 0, failed: 0 };
      });
      const r = await withTenant(t.id, (tx) => sendReminders(tx, port, now));
      r.sent += rs.sent + cs.sent + ds.sent;
      r.failed += rs.failed + cs.failed + ds.failed;
      // Reforço único de confirmação (mesma rodada de 5 min); falha aqui não derruba o lembrete
      const n = await withTenant(t.id, (tx) => sendNudges(tx, port, now)).catch((e) => {
        console.error(JSON.stringify({ level: "warn", msg: "nudge_tenant_failed", tenant: t.id, ...errCode(e) }));
        return { sent: 0, failed: 0, offline: false };
      });
      // Respostas que a cliente recebeu à noite ficaram guardadas: saem às 6h
      const p = await withTenant(t.id, (tx) => sendPendingReplies(tx, port, now)).catch((e) => {
        console.error(JSON.stringify({ level: "warn", msg: "pending_tenant_failed", tenant: t.id, ...errCode(e) }));
        return { sent: 0, failed: 0, offline: false };
      });
      n.sent += p.sent;
      n.failed += p.failed;
      n.offline ||= p.offline;
      if (push)
        await withTenant(t.id, async (tx) =>
          notifyNoReplies(tx, push, now, (await getReminderSettings(tx)).secondHours),
        ).catch((e) =>
          console.error(JSON.stringify({ level: "warn", msg: "no_reply_tenant_failed", tenant: t.id, ...errCode(e) })),
        );
      r.sent += n.sent;
      r.failed += n.failed;
      r.offline ||= n.offline;
      total.sent += r.sent;
      total.failed += r.failed;
      total.offline ||= r.offline;
    } catch (e) {
      console.error(JSON.stringify({ level: "error", msg: "reminders_tenant_failed", tenant: t.id, ...errCode(e) }));
      total.failed++;
    }
  }
  return total;
}
