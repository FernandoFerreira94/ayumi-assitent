"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { aiSettingsInput, salonInput } from "./schema";

/** Dados do salão e da pessoa. O papel do app só lê `tenants`, então grava pelo dono. */
export async function saveSalon(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = salonInput.safeParse({
    name: form.get("name") ?? "",
    ownerName: form.get("ownerName") ?? "",
    businessPhone: form.get("businessPhone") ?? "",
    segments: form.getAll("segments"),
  });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    await getDb()
      .update(tenants)
      .set({
        name: p.data.name,
        ownerName: p.data.ownerName || null,
        businessPhone: p.data.businessPhone,
        segments: p.data.segments,
      })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Regras da profissional para a IA (Ajustes). A IA fica sempre ligada. */
export async function saveAiSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = aiSettingsInput.safeParse({
    aiRules: form.get("aiRules") ?? "",
  });
  if (!p.success) return fail("VALIDATION", "aiRules");
  try {
    await getDb()
      .update(tenants)
      .set({ aiEnabled: true, aiRules: p.data.aiRules || null })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
