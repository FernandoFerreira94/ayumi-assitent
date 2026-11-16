"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { mayEditBlock } from "@/features/team/guard";
import { canAs, ownAgendaId } from "@/features/team/permissions";
import { insertBlock, removeBlock } from "./core";
import { blockInput } from "./schema";

export async function createBlock(_prev: ActionResult<{ id: string }> | null, fd: FormData) {
  const me = await requireTenant();
  const { tenantId } = me;
  // Profissional bloqueia só a agenda dela; dona e gerente bloqueiam o salão todo, como sempre
  const professionalId = ownAgendaId(me);
  if (!canAs(me, "agenda.edit", professionalId)) return fail("FORBIDDEN");
  const parsed = blockInput.safeParse({
    date: fd.get("date") ?? "",
    start: fd.get("start") ?? "",
    end: fd.get("end") ?? "",
    reason: fd.get("reason") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => insertBlock(tx, tenantId, parsed.data, professionalId));
    if (res.ok) {
      revalidatePath("/agenda");
      revalidatePath("/calendario");
      revalidatePath("/vagas");
    }
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  const me = await requireTenant();
  const { tenantId } = me;
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, async (tx) =>
      (await mayEditBlock(tx, me, p.data)) ? removeBlock(tx, p.data) : fail("FORBIDDEN"),
    );
    if (res.ok) {
      revalidatePath("/agenda");
      revalidatePath("/calendario");
      revalidatePath("/vagas");
    }
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}
