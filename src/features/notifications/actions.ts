"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { markAllRead, markRead } from "@/features/messaging/store";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";

/** Uma cliente: deslizar o aviso dela (ou tocar nele) marca as mensagens recebidas como lidas. */
export async function markClientAvisoRead(clientId: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const id = z.string().uuid().safeParse(clientId);
  if (!id.success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) => markRead(tx, id.data));
    revalidatePath("/", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** "Marcar todas como lidas": limpa os avisos de mensagens de uma vez. */
export async function markAllAvisosRead(): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  try {
    await withTenant(tenantId, (tx) => markAllRead(tx));
    revalidatePath("/", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
