"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { errCode, log } from "@/lib/log";
import { requireTenant } from "@/lib/tenant";
import { feedbackInput } from "./feedback";
import { saveFeedback } from "./feedback-core";

export async function sendLaunchFeedback(input: { helps: string; missing: string; score: number }): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  const p = feedbackInput.safeParse(input);
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? "score"));
  try {
    await withTenant(tenantId, (tx) => saveFeedback(tx, tenantId, userId, p.data));
  } catch (e) {
    log("error", "launch_feedback_failed", errCode(e));
    return fail("UNKNOWN");
  }
  revalidatePath("/agenda");
  return ok();
}

export async function skipLaunchFeedback(): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  await withTenant(tenantId, (tx) => saveFeedback(tx, tenantId, userId, "skip"));
  revalidatePath("/agenda");
  return ok();
}
