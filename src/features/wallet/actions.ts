"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { z } from "zod";
import { lockTenant } from "@/features/blocks/core";
import { PAYMENT_METHODS } from "@/features/appointments/payment";
import { parseDiscount } from "@/features/appointments/pricing";
import { formatBRL, formatShortDate, todayStr } from "@/lib/dates";
import { getWalletSettings, refundCredit, saveWalletSettings } from "./core";
import {
  archiveTemplate,
  createTemplate,
  listTemplates,
  sellPackage,
  templateById,
  type TemplateRow,
} from "./packages";
import { packagePreview, packagePrice, parsePackageDraft, parsePolicy } from "./rules";

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

export type TemplateView = TemplateRow & { pricedCents: number; preview: string };

const view = (t: TemplateRow, defaultDays: number): TemplateView => {
  const svc = { name: t.serviceName, priceCents: t.servicePriceCents };
  return {
    ...t,
    pricedCents: packagePrice(t, t.servicePriceCents),
    preview: packagePreview(t, svc, t.validDays ?? defaultDays, formatBRL),
  };
};

/** Modelos de pacote do salão, com preço de hoje e a frase pronta. */
export async function loadPackageTemplates(): Promise<ActionResult<{ templates: TemplateView[]; validDays: number }>> {
  const { tenantId } = await requireTenant();
  try {
    return await withTenant(tenantId, async (tx) => {
      const days = (await getWalletSettings(tx)).packageValidDays;
      return ok({ templates: (await listTemplates(tx)).map((t) => view(t, days)), validDays: days });
    });
  } catch {
    return fail("UNKNOWN");
  }
}

/** Cria um modelo: "Pague X, leve Y" ou "Pacote de sessões". */
export async function createPackageTemplateAction(input: {
  kind: string;
  name: string;
  serviceId: string;
  sessionsPaid: string;
  sessionsTotal: string;
  price: string;
}): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const price = parseDiscount("brl", input.price);
  const parsed = parsePackageDraft({
    ...input,
    priceCents: input.kind === "sessions" ? (price && price !== "invalid" ? price.value : null) : 0,
  });
  if (!parsed.ok) return fail("VALIDATION", parsed.field);
  try {
    const id = await withTenant(tenantId, (tx) => createTemplate(tx, tenantId, parsed.draft));
    if (!id) return fail("VALIDATION", "serviceId");
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Tira o modelo da venda; quem já comprou continua com o pacote. */
export async function archivePackageTemplateAction(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  if (!z.string().uuid().safeParse(id).success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) => archiveTemplate(tx, id));
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Vende um pacote para a cliente (pago na hora; entra no caixa do dia). */
export async function sellPackageAction(input: {
  clientId: string;
  templateId: string;
  method: string | null;
}): Promise<ActionResult<{ name: string; sessions: number; expiresOn: string }>> {
  const { tenantId, userId } = await requireTenant();
  const p = z
    .object({
      clientId: z.string().uuid(),
      templateId: z.string().uuid(),
      method: z.enum(PAYMENT_METHODS).nullable(),
    })
    .safeParse(input);
  if (!p.success) return fail("VALIDATION");
  try {
    const sold = await withTenant(tenantId, async (tx) => {
      await lockTenant(tx, tenantId);
      const t = await templateById(tx, p.data.templateId);
      const r = await sellPackage(tx, { tenantId, ...p.data, today: todayStr(), createdBy: userId });
      return r && t ? { name: t.name, sessions: r.sessions, expiresOn: formatShortDate(r.expiresOn) } : null;
    });
    if (!sold) return fail("NOT_FOUND");
    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    return ok(sold);
  } catch {
    return fail("UNKNOWN");
  }
}
