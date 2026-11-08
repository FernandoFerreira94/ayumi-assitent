"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { syncAppointmentSafe } from "@/features/google/server";
import type { SyncResult } from "@/features/google/sync";
import { searchClients } from "@/features/clients/core";
import { listBookable } from "@/features/services/core";
import { listBlocks } from "@/features/blocks/core";
import { dayRange, isDateStr, toInstant } from "@/lib/dates";
import { insertAppointment, listDay, moveAppointment, setStatus } from "./core";
import { dayVersion } from "./version";
import { bookingOptions, type BookingOptions } from "./options";
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
    serviceId: formData.get("serviceId") ?? "",
    date: formData.get("date") ?? "",
    time: formData.get("time") ?? "",
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => insertAppointment(tx, tenantId, parsed.data));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    const sync = await syncAppointmentSafe(tenantId, res.data.id);
    return ok({ id: res.data.id, sync });
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

export async function updateStatus(id: string, status: string): Promise<ActionResult<{ sync: SyncResult }>> {
  const { tenantId } = await requireTenant();
  const p = z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).safeParse({ id, status });
  if (!p.success) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, (tx) => setStatus(tx, p.data.id, p.data.status));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    return ok({ sync: await syncAppointmentSafe(tenantId, p.data.id) });
  } catch {
    return fail("UNKNOWN");
  }
}
