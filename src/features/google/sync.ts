import { eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services, tenants } from "@/db/schema";
import { GoogleAuthError, type CalendarPort } from "./calendar";

export type SyncResult = "synced" | "skipped" | "auth" | "failed";

/**
 * Espelha um agendamento no Google Agenda.
 * - cancelado → apaga o evento (se existir)
 * - sem evento → cria e guarda o id
 * - com evento → atualiza
 * Nunca lança: falha vira resultado, para não travar a agenda.
 */
export async function syncAppointment(tx: Tx, port: CalendarPort | null, appointmentId: string): Promise<SyncResult> {
  if (!port) return "skipped";
  const [a] = await tx
    .select({
      id: appointments.id,
      status: appointments.status,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      eventId: appointments.googleEventId,
      client: clients.name,
      phone: clients.phoneE164,
      service: services.name,
      tz: tenants.timezone,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(tenants, eq(tenants.id, appointments.tenantId))
    .where(eq(appointments.id, appointmentId));
  if (!a) return "skipped";

  const event = {
    summary: `${a.service} — ${a.client}`,
    description: `WhatsApp: ${a.phone}`,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    timeZone: a.tz,
  };
  try {
    if (a.status === "cancelled") {
      if (a.eventId) {
        await port.deleteEvent(a.eventId);
        await tx.update(appointments).set({ googleEventId: null }).where(eq(appointments.id, a.id));
      }
    } else if (a.eventId) {
      await port.updateEvent(a.eventId, event);
    } else {
      const id = await port.createEvent(event);
      await tx.update(appointments).set({ googleEventId: id }).where(eq(appointments.id, a.id));
    }
    return "synced";
  } catch (e) {
    return e instanceof GoogleAuthError ? "auth" : "failed";
  }
}
