"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { notifyAdmins } from "@/features/admin/alerts";
import { pushFromEnv } from "@/features/push/webpush";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { errCode, log } from "@/lib/log";
import { requireTenant } from "@/lib/tenant";
import { dismissNotice, markSupportRepliesRead, sendSupportMessage } from "./core";
import { newSupportAlert, supportBody } from "./rules";

export async function sendSupport(body: string): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  const p = supportBody.safeParse(body);
  if (!p.success) return fail("VALIDATION", "body");
  let r;
  try {
    r = await withTenant(tenantId, (tx) => sendSupportMessage(tx, tenantId, userId, p.data));
  } catch (e) {
    log("error", "support_send_failed", errCode(e));
    return fail("UNKNOWN");
  }
  if (r.status === "rate_limited") return fail("SUPPORT_RATE_LIMITED");
  const push = pushFromEnv();
  if (r.notifyAdmin && push) {
    void notifyAdmins(push, newSupportAlert(tenantId)).catch((e) => log("warn", "support_alert_failed", errCode(e)));
  }
  revalidatePath("/ajustes/suporte");
  return ok();
}

export async function markSupportRead(): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  await withTenant(tenantId, (tx) => markSupportRepliesRead(tx));
  revalidatePath("/ajustes");
  revalidatePath("/agenda");
  return ok();
}

export async function dismissPlatformNotice(id: string): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("NOT_FOUND");
  await withTenant(tenantId, (tx) => dismissNotice(tx, tenantId, userId, p.data));
  revalidatePath("/agenda");
  return ok();
}
