"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { z } from "zod";
import { lockTenant } from "@/features/blocks/core";
import { PAYMENT_METHODS } from "@/features/appointments/payment";
import { parseDiscount } from "@/features/appointments/pricing";
import { refundCredit, saveWalletSettings } from "./core";
import { parsePolicy } from "./rules";

/** Ajustes > Pagamentos: sinal sugerido, política de cancelamento/falta, validade de pacote e chave Pix. */
export async function saveWalletSettingsAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const get = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const parsed = parsePolicy({
    depositPct: get("depositPct"),
    cancelNoticeHours: get("cancelNoticeHours"),
    packageValidDays: get("packageValidDays"),
    pixKey: get("pixKey"),
    lateCancelKeepsDeposit: get("lateCancelKeepsDeposit"),
    noShowKeepsDeposit: get("noShowKeepsDeposit"),
    noShowUsesSession: get("noShowUsesSession"),
  });
  if (!parsed.ok) return fail("VALIDATION", parsed.field);
  try {
    await withTenant(tenantId, (tx) => saveWalletSettings(tx, tenantId, { ...parsed.policy, pixKey: parsed.pixKey }));
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Devolve à cliente parte ou todo o crédito dela (estorno manual: Pix, dinheiro ou cartão). */
export async function refundCreditAction(input: {
  clientId: string;
  amount: string;
  method: string | null;
}): Promise<ActionResult> {
  const { tenantId, userId } = await requireTenant();
  const p = z
    .object({ clientId: z.string().uuid(), method: z.enum(PAYMENT_METHODS).nullable() })
    .safeParse({ clientId: input.clientId, method: input.method });
  const amount = parseDiscount("brl", input.amount);
  if (!p.success) return fail("VALIDATION");
  if (!amount || amount === "invalid") return fail("VALIDATION", "amount");
  try {
    const res = await withTenant(tenantId, async (tx) => {
      // dois aparelhos devolvendo o mesmo crédito: um espera o outro
      await lockTenant(tx, tenantId);
      return refundCredit(tx, {
        tenantId,
        clientId: p.data.clientId,
        amountCents: amount.value,
        method: p.data.method,
        createdBy: userId,
      });
    });
    if (res === "too_much") return fail("VALIDATION", "amount");
    revalidatePath("/financeiro");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
