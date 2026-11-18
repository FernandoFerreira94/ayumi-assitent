"use server";

import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { removeSubscription, saveSubscription } from "./core";
import { NATIVE_KEY, nativeEndpoint, nativeSubscriptionSchema } from "./native-core";
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

/** App da loja: guarda o token do FCM (Android) ou do APNs (iPhone) deste aparelho. */
export async function subscribeNativePush(raw: unknown): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  const p = nativeSubscriptionSchema.safeParse(raw);
  if (!p.success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) =>
      saveSubscription(tx, tenantId, userId, {
        endpoint: nativeEndpoint(p.data.platform, p.data.token),
        p256dh: NATIVE_KEY,
        auth: NATIVE_KEY,
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
