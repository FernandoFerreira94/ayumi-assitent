import { and, asc, eq, isNull, lt, gte, inArray } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services } from "@/db/schema";

const base = (tx: Tx) =>
  tx
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      priceCents: appointments.priceCents,
      status: appointments.status,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phoneE164,
      serviceId: services.id,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(services, eq(services.id, appointments.serviceId));

export type Pendencias = {
  /** Já passaram e ainda estão como pendente/confirmado: falta concluir ou marcar falta. */
  toClose: Awaited<ReturnType<ReturnType<typeof base>["orderBy"]>>;
  /** Aguardando a cliente confirmar (hoje em diante). */
  toConfirm: Awaited<ReturnType<ReturnType<typeof base>["orderBy"]>>;
  /** Futuros que não chegaram ao Google Agenda (só se o Google estiver conectado). */
  unsynced: Awaited<ReturnType<ReturnType<typeof base>["orderBy"]>>;
  /** A cliente respondeu "3" ao lembrete: a dona precisa combinar outro horário. */
  toReschedule: Awaited<ReturnType<ReturnType<typeof base>["orderBy"]>>;
};

export async function listPendencias(tx: Tx, now: Date, googleConnected: boolean): Promise<Pendencias> {
  const open = inArray(appointments.status, ["pending_confirmation", "confirmed", "reschedule_requested"]);
  const [toClose, toConfirm, unsynced, toReschedule] = await Promise.all([
    base(tx)
      .where(and(open, lt(appointments.endsAt, now)))
      .orderBy(asc(appointments.startsAt)),
    base(tx)
      .where(and(eq(appointments.status, "pending_confirmation"), gte(appointments.endsAt, now)))
      .orderBy(asc(appointments.startsAt)),
    googleConnected
      ? base(tx)
          .where(and(open, gte(appointments.endsAt, now), isNull(appointments.googleEventId)))
          .orderBy(asc(appointments.startsAt))
      : Promise.resolve([]),
    base(tx)
      .where(and(eq(appointments.status, "reschedule_requested"), gte(appointments.endsAt, now)))
      .orderBy(asc(appointments.startsAt)),
  ]);
  return { toClose, toConfirm, unsynced, toReschedule };
}

export const countPendencias = (p: Pendencias) =>
  p.toClose.length + p.toConfirm.length + p.unsynced.length + p.toReschedule.length;
