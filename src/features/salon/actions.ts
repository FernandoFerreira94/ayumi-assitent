"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { salonInput } from "./schema";

/** Nome, tipo e texto do lembrete do salão. O papel do app só lê `tenants`, então grava pelo dono. */
export async function saveSalon(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = salonInput.safeParse({
    name: form.get("name") ?? "",
    businessType: form.get("businessType") ?? "",
    reminderTemplate: form.get("reminderTemplate") ?? "",
  });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    await getDb()
      .update(tenants)
      .set({ name: p.data.name, businessType: p.data.businessType, reminderTemplate: p.data.reminderTemplate || null })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes");
    revalidatePath("/perfil");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
