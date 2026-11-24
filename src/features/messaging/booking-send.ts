import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { appointments, clients, services, tenants } from "@/db/schema";
import { bookingText } from "./booking";
import { messagingForInstance } from "./evolution";
import { sendDirect } from "./send";
import { recordMessage } from "./store";
import { serviceLabel } from "@/features/appointments/core";
import { inviteUrl } from "@/features/calendar-feed/invite-token";
import { errCode } from "@/lib/log";
import { paidCentsSql } from "@/features/wallet/core";
import { sessionUseSql } from "@/features/wallet/packages";
import { parseSessionUse } from "@/features/wallet/session-use";
import { OPTIONS } from "@/features/reminders/text";
import { asFirstReminder } from "./reschedule-send";
import { pixCopyPaste } from "@/features/wallet/pix-brcode";

/** sent = a cliente recebeu; failed = o WhatsApp não enviou; skipped = nada a enviar (sem WhatsApp configurado) */
export type BookingMessageResult = "sent" | "failed" | "skipped";

/**
 * Avisa a cliente, pelo WhatsApp do estúdio, que o agendamento deu certo. Nunca lança: o agendamento já
 * existe e a falha só vira um aviso para a profissional.
 */
export async function sendBookingMessage(
  tenantId: string,
  appointmentId: string,
  now = new Date(),
): Promise<BookingMessageResult> {
  try {
    const [t] = await getDb()
      .select({
        instance: tenants.whatsappInstance,
        name: tenants.name,
        template: tenants.bookingTemplate,
        fullName: tenants.clientNameFull,
        pixKey: tenants.pixKey,
        address: tenants.address,
        city: tenants.addressCity,
        packageLine: tenants.packageLine,
        first: tenants.firstReminder,
        hours: tenants.reminderHours,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    // Só pelo WhatsApp do próprio estúdio: sem instância, não envia
    const port = t?.instance ? messagingForInstance(t.instance) : null;
    if (!port) return "skipped";
    const [a] = await withTenant(tenantId, (tx) =>
      tx
        .select({
          clientId: clients.id,
          client: clients.name,
          phone: clients.phoneE164,
          optedOut: clients.optedOutAt,
          service: serviceLabel,
          startsAt: appointments.startsAt,
          status: appointments.status,
          priceCents: appointments.priceCents,
          depositRequestedCents: appointments.depositRequestedCents,
          paidCents: paidCentsSql,
          session: sessionUseSql(appointments.id, appointments.clientPackageId, appointments.startsAt),
        })
        .from(appointments)
        .innerJoin(clients, eq(clients.id, appointments.clientId))
        .innerJoin(services, eq(services.id, appointments.serviceId))
        .where(eq(appointments.id, appointmentId)),
    );
    // Cliente respondeu SAIR: nada automático. Horário que já passou (atendimento lançado depois) não avisa ninguém
    if (!a || a.optedOut || a.startsAt <= now) return "skipped";
    const calendarUrl = inviteUrl(tenantId, appointmentId);
    // Sinal pedido que o crédito da cliente ainda não cobriu: vai com o valor e o Pix
    const left = a.depositRequestedCents && a.paidCents < a.depositRequestedCents ? a.depositRequestedCents - a.paidCents : 0;
    // Pix "copia e cola" com o valor: vai sozinho numa 2ª mensagem (null = chave não reconhecida; só a chave em texto)
    const code = left ? pixCopyPaste({ key: t?.pixKey, name: t?.name, city: t?.city, cents: left }) : null;
    const deposit = left ? { cents: left, pixKey: t?.pixKey, copyPaste: !!code } : null;
    // Sessão do pacote ("Sessão 3 de 6 do seu pacote"), se a dona deixou ligado em Ajustes > Mensagens
    const session = t?.packageLine ? parseSessionUse(a.session) : null;
    // Pago ao agendar ("Já recebi"/pagou tudo): uma linha de recibo, sem pedir nada
    const paid = !deposit && a.paidCents > 0 ? { cents: a.paidCents, full: a.paidCents >= a.priceCents } : null;
    const body = bookingText({ ...a, calendarUrl, deposit, session, paid }, now, {
      template: t?.template,
      name: t?.name,
      fullName: t?.fullName,
      address: t?.address,
    });
    // Agendou já dentro da janela do 1º aviso: esta mensagem vale como o 1º aviso (pede a confirmação com 1/2/3),
    // senão o worker mandaria o lembrete minutos depois da confirmação
    // Com sinal pendente não pede 1/2/3: quem confirma é o sinal (o 1º aviso lembra o sinal, sem opções)
    const asReminder = !!t && !deposit && asFirstReminder(a, t, now);
    const text = asReminder ? [body, ...OPTIONS].join("\n") : body;
    const res = await sendDirect(port, a.phone, text);
    if (!res.ok) {
      console.error(JSON.stringify({ level: "warn", msg: "booking_message_failed", code: res.code }));
      return "failed";
    }
    // Já saiu: falha ao gravar na conversa não pode virar "não enviada". Como 1º aviso, entra como lembrete
    // (responder citando esta mensagem vale); senão é só a confirmação (citá-la é conversa com a dona)
    if (asReminder)
      await withTenant(tenantId, (tx) =>
        tx
          .update(appointments)
          .set({ reminderSentAt: now })
          .where(and(eq(appointments.id, appointmentId), isNull(appointments.reminderSentAt))),
      ).catch((e) =>
        console.error(JSON.stringify({ level: "warn", msg: "booking_reminder_mark_failed", ...errCode(e) })),
      );
    await withTenant(tenantId, async (tx) => {
      await recordMessage(tx, tenantId, {
        clientId: a.clientId,
        appointmentId,
        direction: "out",
        kind: asReminder ? "reminder" : "auto_reply",
        body: text,
        externalId: res.data.id,
      });
    }).catch((e) =>
      console.error(JSON.stringify({ level: "warn", msg: "booking_message_record_failed", ...errCode(e) })),
    );
    // 2ª mensagem só com o código, para a cliente segurar e copiar inteiro. Falha aqui não muda nada: a chave já foi
    if (code) {
      const second = await sendDirect(port, a.phone, code);
      if (second.ok)
        await withTenant(tenantId, (tx) =>
          recordMessage(tx, tenantId, {
            clientId: a.clientId,
            appointmentId,
            direction: "out",
            kind: "auto_reply",
            body: code,
            externalId: second.data.id,
          }),
        ).catch((e) =>
          console.error(JSON.stringify({ level: "warn", msg: "booking_pix_record_failed", ...errCode(e) })),
        );
      else console.error(JSON.stringify({ level: "warn", msg: "booking_pix_failed", code: second.code }));
    }
    return "sent";
  } catch (e) {
    console.error(JSON.stringify({ level: "warn", msg: "booking_message_error", ...errCode(e) }));
    return "failed";
  }
}
