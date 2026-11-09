"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { expenseInput, insertExpense, removeExpense } from "./expenses";

export async function createExpense(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const parsed = expenseInput.safeParse({
    spentOn: fd.get("spentOn") ?? "",
    amount: fd.get("amount") ?? "",
    category: fd.get("category") ?? "",
    note: fd.get("note") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    await withTenant(tenantId, (tx) => insertExpense(tx, tenantId, parsed.data));
    revalidatePath("/financeiro");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) => removeExpense(tx, p.data));
    revalidatePath("/financeiro");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
