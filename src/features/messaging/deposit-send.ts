import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
import { nextSendable } from "@/features/reminders/quiet";
import { depositReceivedText } from "@/features/reminders/text";
import { paidCentsSql } from "@/features/wallet/core";
import { errCode, log } from "@/lib/log";
import { MessagingOfflineError, MessagingRejectedError, sendFailReason, type MessagingPort } from "./port";
import { recordMessage } from "./store";

const RETRY_MS = 5 * 60_000;

export type DepositNoticeResult = "sent" | "none" | "opted_out" | "offline" | "invalid_number" | "retry" | "error";

/**
 * Sinal recebido, depois do Desfazer: confirma o horário (quem confirma é o sinal) e manda uma vez "Recebi seu
 * sinal". Só se o sinal continua coberto, o horário é futuro e segue aberto. Nunca lança: o pagamento já valeu.
 */
export async function sendDepositNotice(
  tx: Tx,
  tenantId: string,
  appointmentId: string,
  port: MessagingPort,
  now = new Date(),
): Promise<DepositNoticeResult> {
  try {
    const [claimed] = await tx
      .update(appointments)
      .set({ depositNoticeAt: null })
      .where(
        and(
          eq(appointments.id, appointmentId),
          isNotNull(appointments.depositNoticeAt),
          lte(appointments.depositNoticeAt, now),
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
        requested: appointments.depositRequestedCents,
        paid: paidCentsSql,
      })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(eq(appointments.id, appointmentId));
    if (!a || !a.requested || a.paid < a.requested || a.startsAt <= now) return "none";
    if (a.status !== "pending_confirmation" && a.status !== "confirmed") return "none";
    if (a.status === "pending_confirmation")
      await tx
        .update(appointments)
        .set({ status: "confirmed" })
        .where(and(eq(appointments.id, appointmentId), eq(appointments.status, "pending_confirmation")));
    if (a.optedOut) return "opted_out";
    const text = depositReceivedText({ client: a.client, service: a.service, startsAt: a.startsAt, receivedCents: a.paid }, now);
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
        .catch((e) => log("warn", "deposit_notice_record_failed", errCode(e)));
      return "sent";
    } catch (e) {
      log("warn", "deposit_notice_send_failed", { appointment: appointmentId, reason: sendFailReason(e) });
      if (e instanceof MessagingOfflineError) return "offline";
      if (e instanceof MessagingRejectedError) return "invalid_number";
      // Nova tentativa automática não sai de madrugada
      await tx
        .update(appointments)
        .set({ depositNoticeAt: nextSendable(new Date(now.getTime() + RETRY_MS)) })
        .where(eq(appointments.id, appointmentId));
      return "retry";
    }
  } catch (e) {
    log("warn", "deposit_notice_error", errCode(e));
    return "error";
  }
}

/** Rodada do worker: avisos de sinal recebido que já passaram do Desfazer. */
export async function sendDueDepositNotices(
  tx: Tx,
  tenantId: string,
  port: MessagingPort,
  now = new Date(),
): Promise<{ sent: number; failed: number }> {
  const due = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(isNotNull(appointments.depositNoticeAt), lte(appointments.depositNoticeAt, now)))
    .orderBy(sql`${appointments.depositNoticeAt}`)
    .limit(50);
  let sent = 0;
  let failed = 0;
  for (const { id } of due) {
    const r = await sendDepositNotice(tx, tenantId, id, port, now);
    if (r === "sent") sent++;
    else if (r === "retry" || r === "offline" || r === "invalid_number" || r === "error") failed++;
  }
  return { sent, failed };
}
