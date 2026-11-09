"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { formatDayTitle, formatTime, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import { clientSummary, deleteClientRow, insertClient, updateClientRow } from "./core";
import { clientInput } from "./schema";

export async function createClient(_prev: ActionResult<{ id: string }> | null, formData: FormData) {
  const { tenantId } = await requireTenant();
  const parsed = clientInput.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => insertClient(tx, tenantId, parsed.data));
    if (res.ok) revalidatePath("/clientes");
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function updateClient(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const parsed = clientInput.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => updateClientRow(tx, id, parsed.data));
    if (res.ok) revalidatePath("/clientes");
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  try {
    const res = await withTenant(tenantId, (tx) => deleteClientRow(tx, id));
    if (res.ok) revalidatePath("/clientes");
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export type ClientCard = {
  next: { when: string; service: string } | null;
  last: string | null;
  visits: number;
  spentCents: number;
  noShows: number;
};

/** Dados do cartão da cliente, já em texto para a tela (o fuso é o do servidor, igual à agenda). */
export async function loadClientCard(id: string): Promise<ActionResult<ClientCard>> {
  const { tenantId } = await requireTenant();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("VALIDATION");
  try {
    const s = await withTenant(tenantId, (tx) => clientSummary(tx, id));
    const day = (d: Date) => formatDayTitle(todayStr(d));
    return ok({
      next: s.next ? { when: `${day(s.next.startsAt)} às ${formatTime(s.next.startsAt)}`, service: s.next.service } : null,
      last: s.last ? day(s.last.startsAt) : null,
      visits: s.visits,
      spentCents: s.spentCents,
      noShows: s.noShows,
    });
  } catch {
    return fail("UNKNOWN");
  }
}
