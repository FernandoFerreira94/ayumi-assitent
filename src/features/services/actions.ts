"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { insertService } from "./core";
import { serviceInput } from "./schema";

export async function createService(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const parsed = serviceInput.safeParse({
    name: formData.get("name") ?? "",
    durationMin: formData.get("durationMin") ?? "",
    price: formData.get("price") ?? "",
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    await withTenant(tenantId, (tx) => insertService(tx, tenantId, parsed.data));
    revalidatePath("/ajustes");
    revalidatePath("/agenda");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
