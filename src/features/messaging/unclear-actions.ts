"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { UNCLEAR_LABELS } from "./unclear";
import { setUnclearLabel } from "./unclear-admin";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
  label: z.enum(UNCLEAR_LABELS).nullable(),
});

/** Painel do dono: rotula um grupo de respostas não entendidas (vira exemplo e caso de teste). */
export async function labelUnclearReplies(input: { ids: string[]; label: string | null }): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const p = schema.safeParse(input);
  if (!p.success) return fail("VALIDATION");
  if ((await setUnclearLabel(p.data.ids, p.data.label)) === 0) return fail("NOT_FOUND");
  await logAdminAccess({ userId, action: "unclear_labeled", target: `${p.data.label ?? "none"}:${p.data.ids.length}` });
  revalidatePath("/admin/respostas");
  return ok();
}
