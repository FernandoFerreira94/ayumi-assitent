import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services, tenants } from "@/db/schema";
import { SCHEDULE_RESET, serviceLabel } from "@/features/appointments/core";
import { inviteUrl } from "@/features/calendar-feed/invite-token";
import { OPTIONS, rescheduleText } from "@/features/reminders/text";
import { DEFAULT_REMINDER_HOURS } from "@/features/reminders/core";
import { log, errCode } from "@/lib/log";
import { MessagingOfflineError, MessagingRejectedError, sendFailReason, type MessagingPort } from "./port";
import { recordMessage } from "./store";
import { paidCentsSql } from "@/features/wallet/core";
import type { RescheduleNoticeResult } from "./reschedule-result";

/** Falha temporária (rede, 5xx): o aviso volta para a fila e o worker tenta de novo depois deste tempo. */
export const RETRY_MS = 5 * 60_000;

/**
 * Manda (uma vez) o aviso de remarcação pendente do atendimento. Nunca lança: o horário já mudou e a falha só
 * vira um aviso para a profissional.
 *
 * Idempotência: o pendente (`reschedule_notice_at`) é tomado num UPDATE atômico; quem chega depois (outra aba, o
 * worker) encontra nada a fazer. Só avisa se o horário for diferente do que a cliente conhece
 * (`notified_starts_at`): arrastar e Desfazer não manda nada.
 */
export async function sendRescheduleNotice(
  tx: Tx,
  tenantId: string,
  appointmentId: string,
  port: MessagingPort | null,
  now = new Date(),
): Promise<RescheduleNoticeResult> {
  try {
    const [claimed] = await tx
      .update(appointments)
      .set({ rescheduleNoticeAt: null })
      .where(
        and(
          eq(appointments.id, appointmentId),
          isNotNull(appointments.rescheduleNoticeAt),
          lte(appointments.rescheduleNoticeAt, now),
        ),
      )
      .returning({ id: appointments.id });
    if (!claimed) return "none";
    const [a] = await tx
      .select({
        clientId: clients.id,
        client: clients.name,
        phone: clients.phoneE164,
        optedOut: clients.optedOutAt,
        service: serviceLabel,
        startsAt: appointments.startsAt,
        notifiedStartsAt: appointments.notifiedStartsAt,
        status: appointments.status,
        priceCents: appointments.priceCents,
        paidCents: paidCentsSql,
      })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(eq(appointments.id, appointmentId));
    if (!a) return "none";
    const result = await (async (): Promise<RescheduleNoticeResult> => {
      if (a.notifiedStartsAt && a.notifiedStartsAt.getTime() === a.startsAt.getTime()) return "unchanged";
      if (!["pending_confirmation", "confirmed", "reschedule_requested"].includes(a.status)) return "none";
      if (a.startsAt <= now) return "none";
      // O horário mudou de verdade: o que a cliente respondeu/recebeu era do horário antigo (vale mesmo sem aviso:
      // desligado, SAIR ou sem WhatsApp). Antes disso o arraste não mexeu em nada, para o Desfazer não custar nada.
      await tx.update(appointments).set(SCHEDULE_RESET).where(eq(appointments.id, appointmentId));
      a.status = SCHEDULE_RESET.status;
      const [t] = await tx
        .select({
          on: tenants.rescheduleNotice,
          template: tenants.rescheduleTemplate,
          name: tenants.name,
          fullName: tenants.clientNameFull,
          address: tenants.address,
          first: tenants.firstReminder,
          hours: tenants.reminderHours,
        })
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      if (!t?.on) return "off";
      // Cliente respondeu SAIR: nada automático
      if (a.optedOut) return "opted_out";
      // Estúdio sem WhatsApp do próprio número: não envia
      if (!port) return "no_whatsapp";
      const body = rescheduleText({ ...a, calendarUrl: inviteUrl(tenantId, appointmentId) }, now, {
        template: t.template,
        name: t.name,
        fullName: t.fullName,
        address: t.address,
      });
      // Horário novo já dentro da janela do 1º aviso: este aviso vale como o 1º (pede a confirmação com 1/2/3),
      // senão o worker mandaria o lembrete logo em seguida
      const asReminder = asFirstReminder(a, t, now);
      const text = asReminder ? [body, ...OPTIONS].join("\n") : body;
      try {
        const res = await port.sendText(a.phone, text);
        await tx
          .update(appointments)
          .set({ notifiedStartsAt: a.startsAt, ...(asReminder ? { reminderSentAt: now } : {}) })
          .where(eq(appointments.id, appointmentId));
        // Já saiu: falha ao gravar na conversa não pode virar "não enviada"
        await tx
          .transaction((sp) =>
            recordMessage(sp, tenantId, {
              clientId: a.clientId,
              appointmentId,
              direction: "out",
              kind: "reminder",
              body: text,
              externalId: res.id,
              createdAt: now,
            }),
          )
          .catch((e) => log("warn", "reschedule_notice_record_failed", errCode(e)));
        return "sent";
      } catch (e) {
        log("warn", "reschedule_notice_send_failed", { appointment: appointmentId, reason: sendFailReason(e) });
        if (e instanceof MessagingOfflineError) return "offline";
        if (e instanceof MessagingRejectedError) return "invalid_number";
        // Temporária: volta para a fila; o worker tenta de novo (o horário novo continua valendo)
        await tx
          .update(appointments)
          .set({ rescheduleNoticeAt: new Date(now.getTime() + RETRY_MS) })
          .where(eq(appointments.id, appointmentId));
        return "retry";
      }
    })();
    log(result === "sent" || result === "unchanged" || result === "none" ? "info" : "warn", "reschedule_notice", {
      appointment: appointmentId,
      result,
    });
    return result;
  } catch (e) {
    log("warn", "reschedule_notice_error", errCode(e));
    return "error";
  }
}

/** O aviso conta como 1º aviso quando ele está ligado, o horário já entrou na janela e falta a confirmação. */
export function asFirstReminder(
  a: { status: string; startsAt: Date },
  t: { first: boolean; hours: number | null },
  now: Date,
): boolean {
  if (!t.first || a.status !== "pending_confirmation") return false;
  const hours = t.hours ?? DEFAULT_REMINDER_HOURS;
  return a.startsAt.getTime() <= now.getTime() + hours * 3600_000;
}

/** Rodada do worker: avisos vencidos que a tela não mandou (app fechado antes do fim do Desfazer, ou nova tentativa). */
export async function sendDueRescheduleNotices(
  tx: Tx,
  tenantId: string,
  port: MessagingPort,
  now = new Date(),
): Promise<{ sent: number; failed: number }> {
  const due = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(isNotNull(appointments.rescheduleNoticeAt), lte(appointments.rescheduleNoticeAt, now)))
    .orderBy(sql`${appointments.rescheduleNoticeAt}`)
    .limit(50);
  let sent = 0;
  let failed = 0;
  for (const { id } of due) {
    const r = await sendRescheduleNotice(tx, tenantId, id, port, now);
    if (r === "sent") sent++;
    else if (r === "retry" || r === "offline" || r === "invalid_number" || r === "error") failed++;
  }
  return { sent, failed };
}
