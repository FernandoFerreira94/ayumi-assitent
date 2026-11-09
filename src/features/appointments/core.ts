import { and, asc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointmentServices, appointments, clients, services } from "@/db/schema";
import { lockTenant, overlapsBlock } from "@/features/blocks/core";
import { toInstant } from "@/lib/dates";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { applyDiscount, type Discount } from "./pricing";
import type { Status } from "./schema";

/** Nome dos serviços do atendimento ("Escova + Hidratação"); sem a lista nova, o serviço principal. */
export const serviceLabel = sql<string>`coalesce((
  select string_agg(s.name, ' + ' order by x.position)
  from appointment_services x join services s on s.id = x.service_id
  where x.appointment_id = ${appointments.id}
), ${services.name})`;

/** Cada serviço com o valor cheio dele, para dividir o total na pizza do Financeiro. */
const serviceParts = sql<{ name: string; cents: number }[] | string | null>`(
  select json_agg(json_build_object('name', s.name, 'cents', x.price_cents) order by x.position)
  from appointment_services x join services s on s.id = x.service_id
  where x.appointment_id = ${appointments.id}
)`;

export type BookingInput = {
  clientId: string;
  date: string;
  time: string;
  /** Na ordem escolhida; o primeiro vira o serviço principal. */
  serviceIds?: string[];
  /** Forma antiga (um serviço só). */
  serviceId?: string;
  discount?: Discount | null;
};

/** Busca os serviços na ordem pedida; null se algum não existe, está pausado ou foi excluído. */
async function bookableServices(tx: Tx, ids: string[]) {
  const rows = await tx.select().from(services).where(inArray(services.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const list = ids.map((id) => byId.get(id));
  return list.every((x) => x && x.active && x.bookable) ? (list as (typeof rows)[number][]) : null;
}

/** Troca a lista de serviços do atendimento (apaga a antiga e grava a nova, na ordem). */
async function writeServices(
  tx: Tx,
  tenantId: string,
  appointmentId: string,
  list: { id: string; priceCents: number; durationMin: number }[],
) {
  await tx.delete(appointmentServices).where(eq(appointmentServices.appointmentId, appointmentId));
  await tx.insert(appointmentServices).values(
    list.map((x, position) => ({
      appointmentId,
      tenantId,
      serviceId: x.id,
      position,
      priceCents: x.priceCents,
      durationMin: x.durationMin,
    })),
  );
}

function pgCode(e: unknown): string | undefined {
  const x = e as { code?: string; cause?: { code?: string } };
  return x.cause?.code ?? x.code;
}

export async function insertAppointment(
  tx: Tx,
  tenantId: string,
  input: BookingInput,
): Promise<ActionResult<{ id: string }>> {
  const ids = [...new Set(input.serviceIds?.length ? input.serviceIds : input.serviceId ? [input.serviceId] : [])];
  if (ids.length === 0 || ids.length > 5) return fail("VALIDATION", "serviceIds");
  const list = await bookableServices(tx, ids);
  const [cli] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId));
  // pausado ou excluído não entra em agendamento novo
  if (!list) return fail("VALIDATION", "serviceIds");
  if (!cli) return fail("VALIDATION", "clientId");
  const durationMin = list.reduce((m, x) => m + x.durationMin, 0);
  // Um intervalo só, no fim: o maior entre os serviços escolhidos
  const bufferMin = Math.max(...list.map((x) => x.bufferMin));
  const { discountCents, totalCents } = applyDiscount(
    list.reduce((c, x) => c + x.priceCents, 0),
    input.discount ?? null,
  );
  const startsAt = toInstant(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);
  await lockTenant(tx, tenantId);
  const blockedUntil = new Date(endsAt.getTime() + bufferMin * 60_000);
  if (await overlapsBlock(tx, startsAt, blockedUntil)) return fail("SLOT_TAKEN", "time");
  try {
    const row = await tx.transaction(async (sp) => {
      const [r] = await sp
        .insert(appointments)
        .values({
          tenantId,
          clientId: cli.id,
          serviceId: list[0]!.id,
          startsAt,
          endsAt,
          bufferMin,
          priceCents: totalCents,
          discountKind: input.discount?.kind ?? null,
          discountValue: input.discount?.value ?? null,
          discountCents,
          // Fica confirmado quando a cliente responder "1" ao lembrete da véspera
          status: "pending_confirmation",
        })
        .returning({ id: appointments.id });
      await writeServices(sp, tenantId, r.id, list);
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
  input: { date: string; time: string; serviceId: string; single?: boolean },
): Promise<ActionResult> {
  const [a] = await tx
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt, serviceId: appointments.serviceId, priceCents: appointments.priceCents })
    .from(appointments)
    .where(eq(appointments.id, id));
  if (!a) return fail("NOT_ALLOWED");
  let durationMs = a.endsAt.getTime() - a.startsAt.getTime();
  let priceCents = a.priceCents;
  let newService: { id: string; priceCents: number; durationMin: number; bufferMin: number } | null = null;
  // single: o atendimento tinha vários serviços e a pessoa escolheu um só (mesmo que seja o principal)
  if (input.serviceId !== a.serviceId || input.single) {
    const [svc] = await tx.select().from(services).where(eq(services.id, input.serviceId));
    if (!svc || !svc.active || !svc.bookable) return fail("VALIDATION", "serviceId");
    durationMs = svc.durationMin * 60_000;
    priceCents = svc.priceCents;
    newService = svc;
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
          // Trocar o serviço volta para um serviço só, com o valor cheio dele
          ...(newService ? { bufferMin: newService.bufferMin, discountKind: null, discountValue: null, discountCents: 0 } : {}),
          ...(moved ? { status: "pending_confirmation" as const, reminderSentAt: null, replyAt: null } : {}),
        })
        .where(eq(appointments.id, id)),
    );
    if (newService) await writeServices(tx, tenantId, id, [newService]);
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
      serviceName: serviceLabel,
      serviceColor: services.color,
      serviceParts,
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
