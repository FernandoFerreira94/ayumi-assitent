"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { insertBlock, removeBlock } from "./core";
import { blockInput } from "./schema";

export async function createBlock(_prev: ActionResult<{ id: string }> | null, fd: FormData) {
  const { tenantId } = await requireTenant();
  const parsed = blockInput.safeParse({
    date: fd.get("date") ?? "",
    start: fd.get("start") ?? "",
    end: fd.get("end") ?? "",
    reason: fd.get("reason") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => insertBlock(tx, tenantId, parsed.data));
    if (res.ok) {
      revalidatePath("/agenda");
      revalidatePath("/vagas");
    }
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, (tx) => removeBlock(tx, p.data));
    if (res.ok) {
      revalidatePath("/agenda");
      revalidatePath("/vagas");
    }
    return res;
  } catch {
    return fail("UNKNOWN");
  }
}
