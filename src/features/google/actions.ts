"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { syncAppointmentSafe } from "./server";

/** Tenta de novo mandar um agendamento para o Google. */
export async function retrySync(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  const r = await syncAppointmentSafe(tenantId, p.data);
  if (r === "auth") return fail("GOOGLE_EXPIRED");
  if (r === "failed") return fail("NETWORK");
  revalidatePath("/pendencias");
  revalidatePath("/agenda");
  revalidatePath("/calendario");
  return ok();
}
