"use server";

import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { removeSubscription, saveSubscription } from "./core";
import { subscriptionSchema } from "./schema";

export async function subscribePush(raw: unknown): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  const p = subscriptionSchema.safeParse(raw);
  if (!p.success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) =>
      saveSubscription(tx, tenantId, userId, {
        endpoint: p.data.endpoint,
        p256dh: p.data.keys.p256dh,
        auth: p.data.keys.auth,
      }),
    );
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function unsubscribePush(endpoint: string): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  if (typeof endpoint !== "string" || !endpoint) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) => removeSubscription(tx, userId, endpoint));
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
