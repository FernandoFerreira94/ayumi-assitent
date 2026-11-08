"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { MAX_TEMPLATE } from "./templates";

const clean = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "")
    .trim()
    .slice(0, max) || null;

export async function saveProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const name = clean(fd.get("name"), 80);
  if (!name) return fail("VALIDATION", "name");
  try {
    await getDb()
      .update(tenants)
      .set({
        name,
        category: clean(fd.get("category"), 60),
        address: clean(fd.get("address"), 200),
        instagram: clean(fd.get("instagram"), 60),
        msgConfirmation: clean(fd.get("msgConfirmation"), MAX_TEMPLATE),
        msgReminder: clean(fd.get("msgReminder"), MAX_TEMPLATE),
      })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/perfil");
    revalidatePath("/agenda");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
