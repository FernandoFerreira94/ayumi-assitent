"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { syncAppointmentSafe } from "@/features/google/server";
import { sendBookingMessage } from "@/features/messaging/booking-send";
import type { SyncResult } from "@/features/google/sync";
import { searchClients } from "@/features/clients/core";
import { listBookable } from "@/features/services/core";
import { listBlocks } from "@/features/blocks/core";
import { dayRange, isDateStr, toInstant } from "@/lib/dates";
import { editAppointment, insertAppointment, listDay, moveAppointment, setStatus } from "./core";
import { dayVersion } from "./version";
import { bookingOptions, type BookingOptions } from "./options";
import { parseDiscount } from "./pricing";
import { appointmentInput, STATUSES } from "./schema";

/** Opções da folha aberta pelo "Novo" do nav, que pode estar em qualquer tela. */
export async function loadBookingOptions(): Promise<ActionResult<BookingOptions>> {
  const { tenantId } = await requireTenant();
  try {
    const [clients, services] = await withTenant(
      tenantId,
      async (tx) => [await searchClients(tx, ""), await listBookable(tx)] as const,
    );
    return ok(bookingOptions(clients, services));
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

export async function createAppointment(_prev: ActionResult<{ id: string }> | null, formData: FormData) {
  const { tenantId } = await requireTenant();
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
  try {
    const res = await withTenant(tenantId, (tx) => insertAppointment(tx, tenantId, { ...parsed.data, discount }));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    const sync = await syncAppointmentSafe(tenantId, res.data.id);
    // Avisa a cliente que deu certo (dia, horário e, se a profissional quiser, o valor)
    const message = await sendBookingMessage(tenantId, res.data.id);
    return ok({ id: res.data.id, sync, message });
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
): Promise<ActionResult<{ sync: SyncResult }>> {
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
    const res = await withTenant(tenantId, (tx) => moveAppointment(tx, tenantId, p.data.id, startsAt, endsAt));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    return ok({ sync: await syncAppointmentSafe(tenantId, p.data.id) });
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
});

/** Reagenda e/ou troca o serviço pelo card da agenda (a cliente pediu "3" ou combinou por conversa). */
export async function editAppointmentAction(input: {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  /** Tinha vários serviços e a pessoa escolheu um só. */
  single?: boolean;
}): Promise<ActionResult<{ sync: SyncResult }>> {
  const { tenantId } = await requireTenant();
  const p = editInput.safeParse(input);
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    const { id, ...fields } = p.data;
    const res = await withTenant(tenantId, (tx) => editAppointment(tx, tenantId, id, fields));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/pendencias");
    return ok({ sync: await syncAppointmentSafe(tenantId, p.data.id) });
  } catch {
    return fail("UNKNOWN");
  }
}

export async function updateStatus(id: string, status: string): Promise<ActionResult<{ sync: SyncResult }>> {
  const { tenantId } = await requireTenant();
  const p = z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).safeParse({ id, status });
  if (!p.success) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, (tx) => setStatus(tx, p.data.id, p.data.status));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    revalidatePath("/pendencias");
    return ok({ sync: await syncAppointmentSafe(tenantId, p.data.id) });
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
): Promise<ActionResult<{ sync: SyncResult }>> {
  const { tenantId } = await requireTenant();
  const p = manyInput.safeParse(items);
  if (!p.success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, async (tx) => {
      for (const it of p.data) {
        const r = await setStatus(tx, it.id, it.status);
        if (!r.ok) throw new Rollback(r);
      }
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
  return ok({ sync });
}
