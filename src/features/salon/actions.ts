"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { reminderTemplateInput, salonInput } from "./schema";

/** Dados do salão e da pessoa. O papel do app só lê `tenants`, então grava pelo dono. */
export async function saveSalon(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = salonInput.safeParse({
    name: form.get("name") ?? "",
    ownerName: form.get("ownerName") ?? "",
    birthDate: form.get("birthDate") ?? "",
    profession: form.get("profession") ?? "",
    segments: form.getAll("segments"),
  });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    await getDb()
      .update(tenants)
      .set({
        name: p.data.name,
        ownerName: p.data.ownerName || null,
        birthDate: p.data.birthDate || null,
        profession: p.data.profession || null,
        segments: p.data.segments,
      })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Texto do lembrete enviado à cliente (Ajustes). */
export async function saveReminderTemplate(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = reminderTemplateInput.safeParse({ reminderTemplate: form.get("reminderTemplate") ?? "" });
  if (!p.success) return fail("VALIDATION", "reminderTemplate");
  try {
    await getDb()
      .update(tenants)
      .set({ reminderTemplate: p.data.reminderTemplate || null })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
