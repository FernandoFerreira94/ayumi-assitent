"use server";

import { and, count, desc, eq, inArray, isNotNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, withTenant } from "@/db/client";
import { appointments, tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { getWalletSettings } from "@/features/wallet/core";
import { syncAppointmentSafe } from "@/features/google/server";
import { sendBookingMessage } from "@/features/messaging/booking-send";
import { sendRescheduleNotice } from "@/features/messaging/reschedule-send";
import type { RescheduleNoticeResult } from "@/features/messaging/reschedule-result";
import { messagingForInstance } from "@/features/messaging/evolution";
import type { SyncResult } from "@/features/google/sync";
import { searchClients } from "@/features/clients/core";
import { listBookable } from "@/features/services/core";
import { getHours } from "@/features/hours/core";
import { convertExternalBlock, listBlocks } from "@/features/blocks/core";
import { forceSyncExternalCalendars } from "@/features/blocks/external-sync";
import { dayRange, isDateStr, toInstant, todayStr } from "@/lib/dates";
import { freeSlots, weekdayOf } from "@/features/hours/slots";
import type { Outcome } from "@/features/wallet/rules";
import { editAppointment, insertAppointment, listDay, moveAppointment, setPayment, setStatus } from "./core";
import { PAYMENT_METHODS, parsePayment } from "./payment";
import { dayVersion } from "./version";
import { bookingOptions, type BookingOptions } from "./options";
import { parseDiscount } from "./pricing";
import { appointmentInput, STATUSES } from "./schema";

class RollbackWith extends Error {
  constructor(public readonly result: ActionResult<never>) {
    super("rollback");
  }
}

/** Opções da folha aberta pelo "Novo" do nav, que pode estar em qualquer tela. */
export async function loadBookingOptions(): Promise<ActionResult<BookingOptions>> {
  const { tenantId } = await requireTenant();
  try {
    const [clients, services, hours, wallet] = await withTenant(
      tenantId,
      async (tx) =>
        [await searchClients(tx, ""), await listBookable(tx), await getHours(tx), await getWalletSettings(tx)] as const,
    );
    return ok({ ...bookingOptions(clients, services), week: hours, depositPct: wallet.depositPct });
  } catch {
    return fail("UNKNOWN");
  }
}

/**
 * Horários livres do dia para os serviços escolhidos (passo "Quando?" do agendar): soma das durações + o maior
 * intervalo, mesma conta do agendar. `closed` = dia sem expediente.
 */
export async function bookingSlots(
  date: string,
  serviceIds: string[],
): Promise<ActionResult<{ slots: string[]; closed: boolean }>> {
  const { tenantId } = await requireTenant();
  const ids = z.array(z.string().uuid()).min(1).max(5).safeParse(serviceIds);
  if (!isDateStr(date) || !ids.success) return fail("VALIDATION");
  try {
    return ok(
      await withTenant(tenantId, async (tx) => {
        const list = (await listBookable(tx)).filter((s) => ids.data.includes(s.id));
        const week = await getHours(tx);
        const day = week[weekdayOf(date)];
        if (!list.length || !day) return { slots: [], closed: !day };
        const durationMin = list.reduce((n, s) => n + s.durationMin, 0) + Math.max(...list.map((s) => s.bufferMin));
        const range = dayRange(date);
        const [appts, blks] = await Promise.all([listDay(tx, range), listBlocks(tx, range)]);
        const busy = [...appts.map((x) => ({ startsAt: x.startsAt, endsAt: x.blockedUntil })), ...blks];
        const now = new Date();
        const slots = freeSlots({
          date,
          day,
          durationMin,
          busy,
          stepMin: 15,
          notBefore: date === todayStr(now) ? now : undefined,
        });
        return { slots, closed: false };
      }),
    );
  } catch {
    return fail("UNKNOWN");
  }
}

/** O que a folha de agendar mostra além das opções: clientes recentes e o texto para a prévia do WhatsApp. */
export type BookingExtras = {
  recentClientIds: string[];
  message: {
    template: string | null;
    name: string | null;
    fullName: boolean;
    pixKey: string | null;
    /** "Sessão 3 de 6 do seu pacote" vai na mensagem (Ajustes > Mensagens) */
    packageLine: boolean;
  };
};

export async function bookingExtras(): Promise<ActionResult<BookingExtras>> {
  const { tenantId } = await requireTenant();
  try {
    return ok(
      await withTenant(tenantId, async (tx) => {
        const recent = await tx
          .select({ clientId: appointments.clientId, last: max(appointments.createdAt) })
          .from(appointments)
          .groupBy(appointments.clientId)
          .orderBy(desc(max(appointments.createdAt)))
          .limit(8);
        const [t] = await tx
          .select({
            template: tenants.bookingTemplate,
            name: tenants.name,
            fullName: tenants.clientNameFull,
            pixKey: tenants.pixKey,
            packageLine: tenants.packageLine,
          })
          .from(tenants)
          .where(eq(tenants.id, tenantId));
        return {
          recentClientIds: recent.map((r) => r.clientId),
          message: {
            template: t?.template ?? null,
            name: t?.name ?? null,
            fullName: t?.fullName ?? false,
            pixKey: t?.pixKey ?? null,
            packageLine: t?.packageLine ?? true,
          },
        };
      }),
    );
  } catch {
    return fail("UNKNOWN");
  }
}

/** Versão atual da agenda do dia, para a tela saber se outro aparelho (ou o WhatsApp) mexeu nela. */
export async function agendaVersion(date: string): Promise<ActionResult<string>> {
  const { tenantId } = await requireTenant();
  if (!isDateStr(date)) return fail("VALIDATION");
  try {
    const range = dayRange(date);
    return ok(
      await withTenant(tenantId, async (tx) => dayVersion(await listDay(tx, range), await listBlocks(tx, range))),
    );
  } catch {
    return fail("UNKNOWN");
  }
}

/** Botão "Atualizar" (Calendário e Painel): traz agora os eventos do Google/iPhone; a tela recarrega os dados depois. */
export async function refreshAgenda(): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  try {
    await forceSyncExternalCalendars(tenantId);
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function createAppointment(_prev: ActionResult<{ id: string }> | null, formData: FormData) {
  const { tenantId, userId } = await requireTenant();
  const parsed = appointmentInput.safeParse({
    clientId: formData.get("clientId") ?? "",
    // Cada serviço escolhido vem num campo "serviceIds"; vazios são seletores extras ainda sem escolha
    serviceIds: [...new Set(formData.getAll("serviceIds").map(String).filter(Boolean))],
    date: formData.get("date") ?? "",
    time: formData.get("time") ?? "",
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  const discount = parseDiscount(formData.get("discountKind"), formData.get("discountValue"));
  if (discount === "invalid") return fail("VALIDATION", "discountValue");
  const notes =
    String(formData.get("notes") ?? "")
      .trim()
      .slice(0, 300) || null;
  const picked = parsePayment(formData.get("paid"), formData.get("paymentMethod"), formData.get("depositAmount"));
  if (picked === "invalid") return fail("VALIDATION", "depositAmount");
  // "Pedir sinal" não é pagamento: vai na mensagem de agendamento e fica "Sinal pedido"
  const depositRequestCents = picked && "requestCents" in picked ? picked.requestCents : null;
  const payment = picked && "requestCents" in picked ? null : picked;
  // "Transformar em agendamento": o evento de fora (iPhone/Google) que ocupava o horário sai junto
  const fromBlock = z.string().uuid().safeParse(formData.get("fromBlockId"));
  try {
    const res = await withTenant(tenantId, async (tx) => {
      if (fromBlock.success && !(await convertExternalBlock(tx, fromBlock.data))) return fail("NOT_FOUND");
      const r = await insertAppointment(tx, tenantId, {
        ...parsed.data,
        discount,
        notes,
        payment,
        depositRequestCents,
        createdBy: userId,
        usePromotion: formData.get("usePromotion") === "1",
        // Desligado na folha = "0"; sem o campo (outras telas), usa o pacote como antes
        usePackage: formData.get("usePackage") !== "0",
      });
      // sem agendamento, o evento volta como estava (desfaz a transação)
      if (!r.ok && fromBlock.success) throw new RollbackWith(r);
      return r;
    }).catch((e) => {
      if (e instanceof RollbackWith) return e.result;
      throw e;
    });
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    const sync = await syncAppointmentSafe(tenantId, res.data.id);
    // Avisa a cliente que deu certo (dia, horário e, se a profissional quiser, o valor)
    const message = await sendBookingMessage(tenantId, res.data.id);
    return ok({
      id: res.data.id,
      credit: res.data.credit,
      session: res.data.session,
      promotion: res.data.promotion,
      sync,
      message,
    });
  } catch {
    return fail("UNKNOWN");
  }
}

/** Remarca pelo arraste: novo começo (HH:MM) e duração em minutos, de 15 em 15. */
export async function rescheduleAppointment(
  id: string,
  date: string,
  time: string,
  durationMin: number,
): Promise<ActionResult<{ sync: SyncResult; moved: boolean }>> {
  const { tenantId } = await requireTenant();
  const p = z
    .object({
      id: z.string().uuid(),
      date: z.string().refine(isDateStr),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      durationMin: z
        .number()
        .int()
        .min(15)
        .max(12 * 60)
        .multipleOf(15),
    })
    .safeParse({ id, date, time, durationMin });
  if (!p.success) return fail("VALIDATION");
  const startsAt = toInstant(p.data.date, p.data.time);
  const endsAt = new Date(startsAt.getTime() + p.data.durationMin * 60_000);
  try {
    const res = await withTenant(tenantId, (tx) => moveAppointment(tx, tenantId, p.data.id, startsAt, endsAt, "later"));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    // O aviso à cliente espera o Desfazer: a tela chama flushRescheduleNotice depois (moved diz se vale esperar)
    return ok({ sync: await syncAppointmentSafe(tenantId, p.data.id), moved: res.data.moved });
  } catch {
    return fail("UNKNOWN");
  }
}

const editInput = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().refine(isDateStr),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  single: z.boolean().optional(),
  /** false = a dona não quer avisar a cliente desta vez */
  notify: z.boolean().optional(),
});

/** Reagenda e/ou troca o serviço pelo card da agenda (a cliente pediu "3" ou combinou por conversa). */
export async function editAppointmentAction(input: {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  /** Tinha vários serviços e a pessoa escolheu um só. */
  single?: boolean;
  /** Avisar a cliente no WhatsApp se o horário mudou (padrão sim). */
  notify?: boolean;
}): Promise<ActionResult<{ sync: SyncResult; notice: RescheduleNoticeResult | null }>> {
  const { tenantId } = await requireTenant();
  const p = editInput.safeParse(input);
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    const { id, notify, ...fields } = p.data;
    const res = await withTenant(tenantId, (tx) =>
      editAppointment(tx, tenantId, id, fields, notify === false ? "skip" : "now"),
    );
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/pendencias");
    const sync = await syncAppointmentSafe(tenantId, id);
    const notice = res.data.moved && notify !== false ? await notifyReschedule(tenantId, id) : null;
    return ok({ sync, notice });
  } catch {
    return fail("UNKNOWN");
  }
}

/** Manda o aviso de remarcação pendente pelo WhatsApp do próprio estúdio. Nunca lança. */
async function notifyReschedule(tenantId: string, id: string): Promise<RescheduleNoticeResult> {
  try {
    const [t] = await getDb()
      .select({ instance: tenants.whatsappInstance })
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    const port = t?.instance ? messagingForInstance(t.instance) : null;
    return await withTenant(tenantId, (tx) => sendRescheduleNotice(tx, tenantId, id, port));
  } catch {
    return "error";
  }
}

/** Depois do Desfazer do arraste: manda o aviso de remarcação, se ainda houver (o worker cobre se a tela fechar). */
export async function flushRescheduleNotice(id: string): Promise<ActionResult<{ notice: RescheduleNoticeResult }>> {
  const { tenantId } = await requireTenant();
  if (!z.string().uuid().safeParse(id).success) return fail("VALIDATION");
  return ok({ notice: await notifyReschedule(tenantId, id) });
}

const paymentInput = z.object({
  id: z.string().uuid(),
  paid: z.boolean(),
  method: z.enum(PAYMENT_METHODS).nullable().optional(),
  /** Sinal (parte do total), em centavos; sem = pagou tudo */
  amountCents: z.number().int().positive().max(10_000_000).nullable().optional(),
});

/** Marca ou desmarca o pagamento da cliente (no detalhe do atendimento ou no Financeiro). */
export async function updatePayment(input: {
  id: string;
  paid: boolean;
  method?: string | null;
  amountCents?: number | null;
}): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  const p = paymentInput.safeParse(input);
  if (!p.success) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, (tx) =>
      setPayment(
        tx,
        p.data.id,
        p.data.paid ? { method: p.data.method ?? null, amountCents: p.data.amountCents ?? null } : null,
        userId,
      ),
    );
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    revalidatePath("/pendencias");
    revalidatePath("/financeiro");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function updateStatus(
  id: string,
  status: string,
): Promise<ActionResult<{ sync: SyncResult; wallet: Outcome | null }>> {
  const { tenantId, userId } = await requireTenant();
  const p = z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).safeParse({ id, status });
  if (!p.success) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, (tx) => setStatus(tx, p.data.id, p.data.status, new Date(), userId));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    revalidatePath("/pendencias");
    revalidatePath("/clientes");
    return ok({ sync: await syncAppointmentSafe(tenantId, p.data.id), wallet: res.data.wallet });
  } catch {
    return fail("UNKNOWN");
  }
}

const manyInput = z
  .array(z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }))
  .min(1)
  .max(50);

class Rollback {
  constructor(readonly res: ActionResult<never>) {}
}

/**
 * Vários status de uma vez ("Concluir todos" em Pendências e o Desfazer dele). Tudo numa transação:
 * se um falhar, nenhum muda. O Google é avisado depois, um por um; falha dele não desfaz nada.
 */
export async function updateStatuses(
  items: { id: string; status: string }[],
): Promise<ActionResult<{ sync: SyncResult; returns: number }>> {
  const { tenantId, userId } = await requireTenant();
  const p = manyInput.safeParse(items);
  if (!p.success) return fail("VALIDATION");
  let returns = 0;
  try {
    returns = await withTenant(tenantId, async (tx) => {
      for (const it of p.data) {
        const r = await setStatus(tx, it.id, it.status, new Date(), userId);
        if (!r.ok) throw new Rollback(r);
      }
      // quantos concluídos ganharam data de retorno (o toast avisa; a lista fica em Clientes)
      const done = p.data.filter((it) => it.status === "done").map((it) => it.id);
      if (!done.length) return 0;
      const [row] = await tx
        .select({ n: count() })
        .from(appointments)
        .where(and(inArray(appointments.id, done), isNotNull(appointments.returnDueOn)));
      return row?.n ?? 0;
    });
  } catch (e) {
    return e instanceof Rollback ? e.res : fail("UNKNOWN");
  }
  revalidatePath("/agenda");
  revalidatePath("/calendario");
  revalidatePath("/pendencias");
  let sync: SyncResult = "synced";
  for (const it of p.data) {
    const s = await syncAppointmentSafe(tenantId, it.id);
    if (s === "auth" || s === "failed") sync = s;
    else if (sync === "synced") sync = s;
  }
  return ok({ sync, returns });
}
