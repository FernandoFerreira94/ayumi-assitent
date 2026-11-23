import { and, asc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointmentServices, appointments, clients, services } from "@/db/schema";
import { lockTenant, overlapsBlock } from "@/features/blocks/core";
import { returnDue } from "@/features/returns/rules";
import {
  AUTO_DONE_REASON,
  appointmentPaidCents,
  livePaidCents,
  paidCentsSql,
  recordPayment,
  reverseAppointmentPayments,
  settleStatusChange,
  useCredit,
} from "@/features/wallet/core";
import type { Outcome } from "@/features/wallet/rules";
import { pickSession, reserveSession } from "@/features/wallet/packages";
import { pickPromotion } from "@/features/wallet/promotions";
import { toInstant, todayStr } from "@/lib/dates";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { canMarkNoShow } from "./no-show";
import type { PaymentInput } from "./payment";
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
  /** Observação livre, ex.: motivo do desconto. */
  notes?: string | null;
  /** Já pagou ao agendar (tudo ou só o sinal, `amountCents`); a forma é opcional. */
  payment?: PaymentInput | null;
  /** Quem agendou (vai no extrato da carteira). */
  createdBy?: string | null;
  /** Usar a promoção de desconto que estiver valendo (a folha mostra e deixa desligar). */
  usePromotion?: boolean;
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
): Promise<
  ActionResult<{
    id: string;
    credit: number;
    session: { name: string; left: number; total: number } | null;
    promotion: { name: string | null; offCents: number; used: number; maxClients: number | null } | null;
  }>
> {
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
  const startsAt = toInstant(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);
  await lockTenant(tx, tenantId);
  // Pacote da cliente para um dos serviços (valendo no dia): o serviço entra pelo valor da sessão, já pago
  const pick = await pickSession(tx, cli.id, ids, input.date);
  // Promoção de desconto: não soma com desconto digitado nem com sessão de pacote; a vaga é contada aqui (lock)
  const promo =
    input.usePromotion && !input.discount && !pick
      ? await pickPromotion(tx, { clientId: cli.id, booked: list, today: todayStr() })
      : null;
  // Guardada em R$ (o valor certo, mesmo se a promoção cobre só parte dos serviços)
  const discount = promo ? { kind: "brl" as const, value: promo.offCents } : (input.discount ?? null);
  const priced = applyDiscount(
    list.reduce((c, x) => c + x.priceCents, 0),
    discount,
  );
  const { discountCents } = priced;
  const totalCents = pick
    ? Math.max(
        0,
        // a sessão cobre 1 serviço do pacote (o mais caro entre os agendados)
        priced.totalCents -
          Math.max(0, ...list.filter((x) => pick.serviceIds.includes(x.id)).map((x) => x.priceCents)) +
          pick.valueCents,
      )
    : priced.totalCents;
  const owed = totalCents - (pick?.valueCents ?? 0);
  // Sinal nunca passa do que falta; sem valor = pagou tudo
  const paidNow = input.payment ? Math.min(owed, input.payment.amountCents ?? owed) : 0;
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
          discountKind: discount?.kind ?? null,
          discountValue: discount?.value ?? null,
          discountCents,
          promotionId: promo?.id ?? null,
          notes: input.notes || null,
          // Sinal (menos que o total) não marca como pago: fica "Sinal R$ X · falta R$ Y"
          paidAt: (input.payment || pick) && paidNow >= owed ? new Date() : null,
          // A forma no atendimento é a do pagamento completo (o banco exige paid_at); a do sinal fica no extrato
          paymentMethod: input.payment && paidNow >= owed ? input.payment.method : null,
          clientPackageId: pick?.clientPackageId ?? null,
          // Fica confirmado quando a cliente responder "1" ao lembrete da véspera
          status: "pending_confirmation",
        })
        .returning({ id: appointments.id });
      await writeServices(sp, tenantId, r.id, list);
      if (pick)
        await reserveSession(sp, { tenantId, clientId: cli.id, appointmentId: r.id, pick, createdBy: input.createdBy });
      // Carteira: crédito da cliente paga primeiro, sozinho; o "já pagou"/sinal cobre o resto
      const credit = await useCredit(sp, {
        tenantId,
        clientId: cli.id,
        appointmentId: r.id,
        upTo: owed - paidNow,
        createdBy: input.createdBy,
      });
      if (credit > 0 && paidNow + credit >= owed)
        await sp.update(appointments).set({ paidAt: new Date() }).where(eq(appointments.id, r.id));
      if (input.payment)
        await recordPayment(sp, {
          tenantId,
          clientId: cli.id,
          appointmentId: r.id,
          amountCents: paidNow,
          method: input.payment.method,
          createdBy: input.createdBy,
        });
      return {
        id: r.id,
        credit,
        session: pick ? { name: pick.name, left: pick.left, total: pick.total } : null,
        promotion: promo
          ? { name: promo.name, offCents: promo.offCents, used: promo.used, maxClients: promo.maxClients }
          : null,
      };
    });
    return ok(row);
  } catch (e) {
    // 23P01 = exclusion_violation (horário sobreposto)
    if (pgCode(e) === "23P01") return fail("SLOT_TAKEN", "time");
    throw e;
  }
}

/**
 * Data prevista do retorno de um atendimento: o menor retorno entre os serviços dele (os de
 * `appointment_services` e o principal), contado do dia do atendimento no fuso do estúdio.
 */
async function returnDueFor(tx: Tx, id: string): Promise<string | null> {
  const [row] = await tx
    .select({ startsAt: appointments.startsAt, serviceId: appointments.serviceId })
    .from(appointments)
    .where(eq(appointments.id, id));
  if (!row) return null;
  const list = await tx
    .select({ returnDays: services.returnDays })
    .from(services)
    .where(
      sql`${services.id} = ${row.serviceId} or ${services.id} in (select ${appointmentServices.serviceId} from ${appointmentServices} where ${appointmentServices.appointmentId} = ${id})`,
    );
  return returnDue(todayStr(row.startsAt), list);
}

/**
 * Muda o status. Concluir grava a data prevista do retorno (se algum serviço tem retorno);
 * qualquer outro status (inclusive o Desfazer) limpa a data e o "Não precisa".
 * Faltou só vale depois do horário de início (`NO_SHOW_TOO_EARLY` antes disso).
 */
export async function setStatus(
  tx: Tx,
  id: string,
  status: Status,
  now: Date = new Date(),
  createdBy?: string | null,
): Promise<ActionResult<{ wallet: Outcome | null }>> {
  const [before] = await tx
    .select({ startsAt: appointments.startsAt, status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, id));
  if (!before) return fail("NOT_ALLOWED");
  // Falta só depois do horário de início (a tela já esconde; aqui é a trava de verdade)
  if (status === "no_show" && !canMarkNoShow(before.startsAt, now)) return fail("NO_SHOW_TOO_EARLY");
  try {
    const returnFields =
      status === "done" ? { returnDueOn: await returnDueFor(tx, id) } : { returnDueOn: null, returnSkippedAt: null };
    const rows = await tx.transaction((sp) =>
      sp
        .update(appointments)
        .set({ status, ...returnFields })
        .where(eq(appointments.id, id))
        .returning({
          tenantId: appointments.tenantId,
          clientId: appointments.clientId,
          priceCents: appointments.priceCents,
          paymentMethod: appointments.paymentMethod,
        }),
    );
    const a = rows[0];
    if (!a) return fail("NOT_ALLOWED");
    // Carteira: concluir dá baixa no que faltava (pago no atendimento); sair de concluído anula essa baixa
    if (status === "done") {
      const rest = a.priceCents - (await appointmentPaidCents(tx, id));
      if (rest > 0)
        await recordPayment(tx, {
          tenantId: a.tenantId,
          clientId: a.clientId,
          appointmentId: id,
          amountCents: rest,
          method: a.paymentMethod,
          reason: AUTO_DONE_REASON,
        });
    } else await reverseAppointmentPayments(tx, id, createdBy, { onlyAuto: true, reason: "Saiu de concluído" });
    // Cancelar/faltar: o pago vira crédito (ou o sinal fica); voltar desfaz
    const wallet = await settleStatusChange(
      tx,
      { id, tenantId: a.tenantId, clientId: a.clientId, startsAt: before.startsAt, priceCents: a.priceCents },
      before.status,
      status,
      now,
      createdBy,
    );
    return ok({ wallet });
  } catch (e) {
    if (pgCode(e) === "23P01") return fail("SLOT_TAKEN");
    throw e;
  }
}

/**
 * Marca o pagamento da cliente: tudo, só o sinal (`amountCents` menor que o total) ou nada (null = a pagar).
 * Não mexe no status nem no valor. Cancelado não aceita marcação nova.
 * No extrato: subir o valor (sinal → tudo) grava só a diferença; baixar, desmarcar ou trocar a forma anula os
 * pagamentos que valiam e grava o novo. Nada é apagado.
 */
export async function setPayment(
  tx: Tx,
  id: string,
  payment: PaymentInput | null,
  createdBy?: string | null,
): Promise<ActionResult> {
  const [a] = await tx
    .select({
      tenantId: appointments.tenantId,
      clientId: appointments.clientId,
      priceCents: appointments.priceCents,
      status: appointments.status,
      paidAt: appointments.paidAt,
      paymentMethod: appointments.paymentMethod,
    })
    .from(appointments)
    .where(eq(appointments.id, id));
  // Cancelado/faltou: o pago já foi acertado (crédito ou sinal retido); mexer aqui bagunçaria a carteira
  if (!a || a.status === "cancelled" || a.status === "no_show") return fail("NOT_ALLOWED");

  const current = await livePaidCents(tx, id);
  // Parte paga com crédito da cliente fica; o pagamento em dinheiro só cobre o resto
  const credit = Math.max(0, (await appointmentPaidCents(tx, id)) - current);
  const wanted = payment ? Math.min(a.priceCents, payment.amountCents ?? a.priceCents) : 0;
  const target = Math.max(0, wanted - credit);
  const sameMethod = !payment || payment.method === null || payment.method === a.paymentMethod;
  // Subiu (sinal → tudo): só a diferença, na forma escolhida agora (sinal no Pix e o resto em dinheiro, por ex.)
  if (payment && target > current) {
    await recordPayment(tx, {
      tenantId: a.tenantId,
      clientId: a.clientId,
      appointmentId: id,
      amountCents: target - current,
      method: payment.method,
      createdBy,
    });
  } else if (target < current || !sameMethod) {
    await reverseAppointmentPayments(tx, id, createdBy);
    if (payment)
      await recordPayment(tx, {
        tenantId: a.tenantId,
        clientId: a.clientId,
        appointmentId: id,
        amountCents: target,
        method: payment.method,
        createdBy,
      });
  }
  const full = payment !== null && wanted >= a.priceCents;
  await tx
    .update(appointments)
    .set({
      paidAt: full ? (a.paidAt ?? new Date()) : null,
      paymentMethod: full ? (payment.method ?? a.paymentMethod) : null,
    })
    .where(eq(appointments.id, id));
  return ok();
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
    .select({
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      serviceId: appointments.serviceId,
      priceCents: appointments.priceCents,
    })
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
          ...(newService
            ? {
                bufferMin: newService.bufferMin,
                discountKind: null,
                discountValue: null,
                discountCents: 0,
                // sem o desconto, a vaga da promoção volta
                promotionId: null,
              }
            : {}),
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
      discountKind: appointments.discountKind,
      discountValue: appointments.discountValue,
      discountCents: appointments.discountCents,
      notes: appointments.notes,
      paidAt: appointments.paidAt,
      paymentMethod: appointments.paymentMethod,
      paidCents: paidCentsSql,
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
