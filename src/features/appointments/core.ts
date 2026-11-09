import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services } from "@/db/schema";
import { lockTenant, overlapsBlock } from "@/features/blocks/core";
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
  // pausado ou excluído não entra em agendamento novo
  if (!svc || !svc.active || !svc.bookable) return fail("VALIDATION", "serviceId");
  if (!cli) return fail("VALIDATION", "clientId");
  const startsAt = toInstant(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + svc.durationMin * 60_000);
  await lockTenant(tx, tenantId);
  const blockedUntil = new Date(endsAt.getTime() + svc.bufferMin * 60_000);
  if (await overlapsBlock(tx, startsAt, blockedUntil)) return fail("SLOT_TAKEN", "time");
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
          bufferMin: svc.bufferMin,
          priceCents: svc.priceCents,
          // Fica confirmado quando a cliente responder "1" ao lembrete da véspera
          status: "pending_confirmation",
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

/**
 * Muda começo e fim de um atendimento (arrastar na agenda). Zera o lembrete enviado,
 * para o worker mandar de novo com o horário novo.
 */
export async function moveAppointment(
  tx: Tx,
  tenantId: string,
  id: string,
  startsAt: Date,
  endsAt: Date,
): Promise<ActionResult> {
  await lockTenant(tx, tenantId);
  if (await overlapsBlock(tx, startsAt, endsAt)) return fail("SLOT_TAKEN", "time");
  try {
    const rows = await tx.transaction((sp) =>
      sp
        .update(appointments)
        .set({ startsAt, endsAt, reminderSentAt: null })
        .where(and(eq(appointments.id, id), ne(appointments.status, "cancelled")))
        .returning({ id: appointments.id }),
    );
    return rows.length ? ok() : fail("NOT_ALLOWED");
  } catch (e) {
    if (pgCode(e) === "23P01") return fail("SLOT_TAKEN", "time");
    throw e;
  }
}

/**
 * Edita o atendimento: outro dia/horário e/ou outro serviço (que traz a própria duração e valor).
 * Se o horário mudou, volta a "aguardando confirmação" e limpa lembrete e resposta: a cliente
 * recebe um lembrete novo, do horário novo. Só trocar o serviço mantém o status.
 */
export async function editAppointment(
  tx: Tx,
  tenantId: string,
  id: string,
  input: { date: string; time: string; serviceId: string },
): Promise<ActionResult> {
  const [a] = await tx
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt, serviceId: appointments.serviceId, priceCents: appointments.priceCents })
    .from(appointments)
    .where(eq(appointments.id, id));
  if (!a) return fail("NOT_ALLOWED");
  let durationMs = a.endsAt.getTime() - a.startsAt.getTime();
  let priceCents = a.priceCents;
  if (input.serviceId !== a.serviceId) {
    const [svc] = await tx.select().from(services).where(eq(services.id, input.serviceId));
    if (!svc || !svc.active || !svc.bookable) return fail("VALIDATION", "serviceId");
    durationMs = svc.durationMin * 60_000;
    priceCents = svc.priceCents;
  }
  const startsAt = toInstant(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + durationMs);
  const moved = startsAt.getTime() !== a.startsAt.getTime();
  await lockTenant(tx, tenantId);
  if (await overlapsBlock(tx, startsAt, endsAt)) return fail("SLOT_TAKEN", "time");
  try {
    await tx.transaction((sp) =>
      sp
        .update(appointments)
        .set({
          startsAt,
          endsAt,
          serviceId: input.serviceId,
          priceCents,
          ...(moved ? { status: "pending_confirmation" as const, reminderSentAt: null, replyAt: null } : {}),
        })
        .where(eq(appointments.id, id)),
    );
    return ok();
  } catch (e) {
    if (pgCode(e) === "23P01") return fail("SLOT_TAKEN", "time");
    throw e;
  }
}

export function listDay(tx: Tx, [from, to]: [Date, Date]) {
  return tx
    .select({
      id: appointments.id,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      blockedUntil: appointments.blockedUntil,
      priceCents: appointments.priceCents,
      status: appointments.status,
      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phoneE164,
      serviceId: appointments.serviceId,
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

/** Já recebido: só o que foi marcado como concluído. O que falta é o previsto menos isso. */
export const receivedCents = (rows: { priceCents: number; status: Status }[]) =>
  rows.filter((r) => r.status === "done").reduce((sum, r) => sum + r.priceCents, 0);
