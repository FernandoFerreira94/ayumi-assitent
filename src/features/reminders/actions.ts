"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { saveReminderHours } from "./core";

export async function saveReminderSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const hours = Number(fd.get("hours"));
  if (!Number.isInteger(hours) || hours < 1 || hours > 72) return fail("VALIDATION", "hours");
  try {
    await withTenant(tenantId, (tx) => saveReminderHours(tx, tenantId, hours));
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
