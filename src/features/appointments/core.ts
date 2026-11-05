import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services } from "@/db/schema";
import { toInstant } from "@/lib/dates";
import { fail, ok, type ActionResult } from "@/lib/errors";
import type { AppointmentInput, Status } from "./schema";

function pgCode(e: unknown): string | undefined {
  const x = e as { code?: string; cause?: { code?: string } };
  return x.cause?.code ?? x.code;
}

export async function insertAppointment(
  tx: Tx,
  tenantId: string,
  input: AppointmentInput,
): Promise<ActionResult<{ id: string }>> {
  const [svc] = await tx.select().from(services).where(eq(services.id, input.serviceId));
  const [cli] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId));
  if (!svc || !cli) return fail("VALIDATION", svc ? "clientId" : "serviceId");
  const startsAt = toInstant(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + svc.durationMin * 60_000);
  try {
    const row = await tx.transaction(async (sp) => {
      const [r] = await sp
        .insert(appointments)
        .values({
          tenantId,
          clientId: cli.id,
          serviceId: svc.id,
          startsAt,
          endsAt,
          priceCents: svc.priceCents,
          status: "confirmed",
        })
        .returning({ id: appointments.id });
      return r;
    });
    return ok({ id: row.id });
  } catch (e) {
    // 23P01 = exclusion_violation (horário sobreposto)
    if (pgCode(e) === "23P01") return fail("SLOT_TAKEN", "time");
    throw e;
  }
}

export async function setStatus(tx: Tx, id: string, status: Status): Promise<ActionResult> {
  try {
    const rows = await tx.transaction((sp) =>
      sp.update(appointments).set({ status }).where(eq(appointments.id, id)).returning({ id: appointments.id }),
    );
    return rows.length ? ok() : fail("NOT_ALLOWED");
  } catch (e) {
    if (pgCode(e) === "23P01") return fail("SLOT_TAKEN");
    throw e;
  }
}

export function listDay(tx: Tx, [from, to]: [Date, Date]) {
  return tx
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      priceCents: appointments.priceCents,
      status: appointments.status,
      clientName: clients.name,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(and(gte(appointments.startsAt, from), lt(appointments.startsAt, to), ne(appointments.status, "cancelled")))
    .orderBy(asc(appointments.startsAt));
}

/** Previsto do dia: soma dos valores dos atendimentos que não foram cancelados nem faltaram. */
export const forecastCents = (rows: { priceCents: number; status: Status }[]) =>
  rows.filter((r) => r.status !== "no_show").reduce((sum, r) => sum + r.priceCents, 0);
