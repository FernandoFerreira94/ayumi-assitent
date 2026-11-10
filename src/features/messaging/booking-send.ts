import "server-only";
import { eq } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { appointments, clients, services, tenants } from "@/db/schema";
import { bookingText } from "./booking";
import { messagingForInstance } from "./evolution";
import { sendDirect } from "./send";
import { recordMessage } from "./store";
import { serviceLabel } from "@/features/appointments/core";

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
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    // Mesma regra dos lembretes: sem instância própria, usa a do ambiente
    const instance = t?.instance ?? process.env.EVOLUTION_INSTANCE;
    const port = instance ? messagingForInstance(instance) : null;
    if (!port) return "skipped";
    const [a] = await withTenant(tenantId, (tx) =>
      tx
        .select({
          clientId: clients.id,
          client: clients.name,
          phone: clients.phoneE164,
          service: serviceLabel,
          startsAt: appointments.startsAt,
          priceCents: appointments.priceCents,
        })
        .from(appointments)
        .innerJoin(clients, eq(clients.id, appointments.clientId))
        .innerJoin(services, eq(services.id, appointments.serviceId))
        .where(eq(appointments.id, appointmentId)),
    );
    if (!a) return "skipped";
    const text = bookingText(a, now, { template: t?.template, name: t?.name, fullName: t?.fullName });
    const res = await sendDirect(port, a.phone, text);
    if (!res.ok) {
      console.error(JSON.stringify({ level: "warn", msg: "booking_message_failed", code: res.code }));
      return "failed";
    }
    // Já saiu: falha ao gravar na conversa não pode virar "não enviada"
    await withTenant(tenantId, (tx) =>
      recordMessage(tx, tenantId, {
        clientId: a.clientId,
        appointmentId,
        direction: "out",
        kind: "auto_reply",
        body: text,
        externalId: res.data.id,
      }),
    ).catch((e) =>
      console.error(JSON.stringify({ level: "warn", msg: "booking_message_record_failed", err: String(e) })),
    );
    return "sent";
  } catch (e) {
    console.error(JSON.stringify({ level: "warn", msg: "booking_message_error", err: String(e) }));
    return "failed";
  }
}
