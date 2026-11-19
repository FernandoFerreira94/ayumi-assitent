"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { saveWalletSettings } from "./core";
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
