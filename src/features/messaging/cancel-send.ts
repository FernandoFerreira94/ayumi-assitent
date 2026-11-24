import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services, tenants } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
import { cancelText } from "@/features/reminders/text";
import { errCode, log } from "@/lib/log";
import { MessagingOfflineError, MessagingRejectedError, sendFailReason, type MessagingPort } from "./port";
import { recordMessage } from "./store";
import { nextSendable } from "@/features/reminders/quiet";

const RETRY_MS = 5 * 60_000;

export type CancelNoticeResult = "sent" | "none" | "opted_out" | "offline" | "invalid_number" | "retry" | "error";

/**
 * Manda (uma vez) o aviso de cancelamento pendente. Só sai se o atendimento continua cancelado (Desfazer limpa o
 * pendente) e o horário ainda não passou. Nunca lança: o cancelamento já valeu.
 */
export async function sendCancelNotice(
  tx: Tx,
  tenantId: string,
  appointmentId: string,
  port: MessagingPort,
  now = new Date(),
): Promise<CancelNoticeResult> {
  try {
    const [claimed] = await tx
      .update(appointments)
      .set({ cancelNoticeAt: null })
      .where(
        and(
          eq(appointments.id, appointmentId),
          isNotNull(appointments.cancelNoticeAt),
          lte(appointments.cancelNoticeAt, now),
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
        status: appointments.status,
      })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(eq(appointments.id, appointmentId));
    if (!a || a.status !== "cancelled" || a.startsAt <= now) return "none";
    if (a.optedOut) return "opted_out";
    const [t] = await tx
      .select({ name: tenants.name, fullName: tenants.clientNameFull })
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    const text = cancelText(a, now, { name: t?.name, fullName: t?.fullName });
    try {
      const res = await port.sendText(a.phone, text);
      // Já saiu: falha ao gravar na conversa não pode virar "não enviada"
      await tx
        .transaction((sp) =>
          recordMessage(sp, tenantId, {
            clientId: a.clientId,
            appointmentId,
            direction: "out",
            kind: "auto_reply",
            body: text,
            externalId: res.id,
            createdAt: now,
          }),
        )
        .catch((e) => log("warn", "cancel_notice_record_failed", errCode(e)));
      return "sent";
    } catch (e) {
      log("warn", "cancel_notice_send_failed", { appointment: appointmentId, reason: sendFailReason(e) });
      if (e instanceof MessagingOfflineError) return "offline";
      if (e instanceof MessagingRejectedError) return "invalid_number";
      await tx
        .update(appointments)
        // A nova tentativa não sai de madrugada (o cancelamento foi da dona, mas a tentativa é automática)
        .set({ cancelNoticeAt: nextSendable(new Date(now.getTime() + RETRY_MS)) })
        .where(eq(appointments.id, appointmentId));
      return "retry";
    }
  } catch (e) {
    log("warn", "cancel_notice_error", errCode(e));
    return "error";
  }
}

/** Rodada do worker: avisos de cancelamento que já passaram do Desfazer. */
export async function sendDueCancelNotices(
  tx: Tx,
  tenantId: string,
  port: MessagingPort,
  now = new Date(),
): Promise<{ sent: number; failed: number }> {
  const due = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(isNotNull(appointments.cancelNoticeAt), lte(appointments.cancelNoticeAt, now)))
    .orderBy(sql`${appointments.cancelNoticeAt}`)
    .limit(50);
  let sent = 0;
  let failed = 0;
  for (const { id } of due) {
    const r = await sendCancelNotice(tx, tenantId, id, port, now);
    if (r === "sent") sent++;
    else if (r === "retry" || r === "offline" || r === "invalid_number" || r === "error") failed++;
  }
  return { sent, failed };
}
