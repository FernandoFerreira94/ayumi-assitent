import "server-only";
import { eq } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { appointments, services, tenants } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
import { inviteIcs } from "./ics";

/** Depois do atendimento, o link continua valendo por 7 dias e depois some (404). */
export const INVITE_GRACE_MS = 7 * 86_400_000;

/** ICS do convite, ou null se o agendamento não existe mais ou já passou da validade. */
export async function appointmentInvite(tenantId: string, appointmentId: string, now = new Date()) {
  // tenants não tem FORCE RLS (igual ao link do Calendário do iPhone)
  const [t] = await getDb()
    .select({ name: tenants.name, address: tenants.address })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!t) return null;
  const [a] = await withTenant(tenantId, (tx) =>
    tx
      .select({
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        status: appointments.status,
        createdAt: appointments.createdAt,
        service: serviceLabel,
      })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(eq(appointments.id, appointmentId))
      .limit(1),
  );
  if (!a || a.endsAt.getTime() + INVITE_GRACE_MS < now.getTime()) return null;
  return inviteIcs({
    appointmentId,
    start: a.startsAt,
    end: a.endsAt,
    service: a.service,
    salonName: t.name,
    address: t.address,
    cancelled: a.status === "cancelled",
    createdAt: a.createdAt,
    now,
  });
}
