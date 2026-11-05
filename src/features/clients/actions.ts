"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { insertClient } from "./core";
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
