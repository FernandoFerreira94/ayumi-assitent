"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { sendToAll } from "@/features/push/core";
import { pushFromEnv } from "@/features/push/webpush";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { errCode, log } from "@/lib/log";
import { endNotice, reopenNotice, insertAdminReply, insertNotice, markSalonMessagesRead } from "./admin-write";
import { noticeInput, supportBody, supportReplyAlert } from "./rules";

const tenantIdSchema = z.string().uuid();

/** Resposta do dono: grava, marca o salão como lido e avisa os aparelhos do salão (sem travar a tela). */
export async function replySupport(input: { tenantId: string; body: string }): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const t = tenantIdSchema.safeParse(input.tenantId);
  const b = supportBody.safeParse(input.body);
  if (!t.success) return fail("NOT_FOUND");
  if (!b.success) return fail("VALIDATION", "body");
  try {
    if (!(await insertAdminReply(t.data, userId, b.data))) return fail("NOT_FOUND");
  } catch (e) {
    log("error", "support_reply_failed", errCode(e));
    return fail("UNKNOWN");
  }
  await logAdminAccess({ userId, action: "support_reply", target: t.data });
  const push = pushFromEnv();
  if (push) {
    void withTenant(t.data, (tx) => sendToAll(tx, push, supportReplyAlert())).catch((e) =>
      log("warn", "support_reply_push_failed", errCode(e)),
    );
  }
  revalidatePath("/admin/suporte");
  return ok();
}

/** Abrir a conversa conta como lida (some o número do menu). */
export async function markSupportSeen(tenantId: string): Promise<ActionResult> {
  await requireAdmin();
  const t = tenantIdSchema.safeParse(tenantId);
  if (!t.success) return fail("NOT_FOUND");
  await markSalonMessagesRead(t.data);
  revalidatePath("/admin", "layout");
  return ok();
}

export async function createPlatformNotice(input: {
  title: string;
  body: string;
  tone: string;
  days: string;
}): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const p = noticeInput.safeParse(input);
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    const id = await insertNotice(p.data, userId);
    await logAdminAccess({ userId, action: "notice_created", target: id });
  } catch (e) {
    log("error", "notice_create_failed", errCode(e));
    return fail("UNKNOWN");
  }
  revalidatePath("/admin/avisos");
  return ok();
}

export async function endPlatformNotice(id: string): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const p = z.string().uuid().safeParse(id);
  if (!p.success || !(await endNotice(p.data))) return fail("NOT_FOUND");
  await logAdminAccess({ userId, action: "notice_ended", target: p.data });
  revalidatePath("/admin/avisos");
  return ok();
}

export async function reopenPlatformNotice(id: string): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const p = z.string().uuid().safeParse(id);
  if (!p.success || !(await reopenNotice(p.data))) return fail("NOT_FOUND");
  await logAdminAccess({ userId, action: "notice_reopened", target: p.data });
  revalidatePath("/admin/avisos");
  return ok();
}
