"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult, type ErrorCode } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { z } from "zod";
import { lockTenant } from "@/features/blocks/core";
import { PAYMENT_METHODS } from "@/features/appointments/payment";
import { parseDiscount } from "@/features/appointments/pricing";
import { formatShortDate, todayStr } from "@/lib/dates";
import { getWalletSettings, refundCredit, saveWalletSettings } from "./core";
import {
  archiveTemplate,
  createTemplate,
  listTemplates,
  sellPackage,
  setTemplatePaused,
  type SellRefusal,
} from "./packages";
import { createPromotion, endPromotion, listPromotions, setPromotionPaused } from "./promotions";
import { parsePromotionDraft } from "./promotion-rules";
import { parsePackageDraft, parsePolicy } from "./rules";
import { promotionView, templateView, type PromotionView, type TemplateView } from "./views";

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

/** Modelos de pacote do salão, com preço de hoje, a frase pronta e a situação da promoção. */
export async function loadPackageTemplates(): Promise<ActionResult<{ templates: TemplateView[]; validDays: number }>> {
  const { tenantId } = await requireTenant();
  try {
    return await withTenant(tenantId, async (tx) => {
      const days = (await getWalletSettings(tx)).packageValidDays;
      const today = todayStr();
      return ok({ templates: (await listTemplates(tx)).map((t) => templateView(t, days, today)), validDays: days });
    });
  } catch {
    return fail("UNKNOWN");
  }
}

/** Cria um modelo: "Pague X, leve Y" ou "Pacote de sessões", com 1 ou mais serviços e promoção opcional. */
export async function createPackageTemplateAction(input: {
  kind: string;
  name: string;
  serviceIds: string[];
  sessionsPaid: string;
  sessionsTotal: string;
  price: string;
  /** como o preço foi digitado: preço final (padrão) ou desconto em % / R$ sobre o valor cheio */
  priceMode?: "final" | "pct" | "brl";
  startsOn?: string;
  endsOn?: string;
  maxClients?: string;
}): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const byDiscount = input.kind === "sessions" && (input.priceMode === "pct" || input.priceMode === "brl");
  const price = parseDiscount(byDiscount ? input.priceMode : "brl", input.price);
  if (byDiscount && (!price || price === "invalid")) return fail("VALIDATION", "priceCents");
  const parsed = parsePackageDraft({
    ...input,
    serviceIds: Array.isArray(input.serviceIds) ? input.serviceIds.map(String) : [],
    priceCents: input.kind === "sessions" && !byDiscount ? (price && price !== "invalid" ? price.value : null) : 0,
    discount: byDiscount && price && price !== "invalid" ? price : null,
  });
  if (!parsed.ok) return fail("VALIDATION", parsed.field);
  try {
    const id = await withTenant(tenantId, (tx) => createTemplate(tx, tenantId, parsed.draft));
    if (!id) return fail("VALIDATION", "serviceIds");
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
      return sellPackage(tx, { tenantId, ...p.data, today: todayStr(), createdBy: userId });
    });
    if (!sold.ok) return fail(REFUSAL[sold.reason]);
    revalidatePath("/financeiro");
    revalidatePath("/clientes");
    return ok({ name: sold.name, sessions: sold.sessions, expiresOn: formatShortDate(sold.expiresOn) });
  } catch {
    return fail("UNKNOWN");
  }
}

const REFUSAL: Record<SellRefusal, ErrorCode> = {
  not_found: "NOT_FOUND",
  scheduled: "PROMO_NOT_STARTED",
  ended: "PROMO_ENDED",
  sold_out: "PROMO_SOLD_OUT",
  already_bought: "PROMO_ALREADY_BOUGHT",
  paused: "PROMO_PAUSED",
};

/** Promoções de desconto (com situação, usos e o texto para divulgar). */
export async function loadPromotions(): Promise<ActionResult<PromotionView[]>> {
  const { tenantId } = await requireTenant();
  try {
    const today = todayStr();
    return ok(await withTenant(tenantId, async (tx) => (await listPromotions(tx)).map((p) => promotionView(p, today))));
  } catch {
    return fail("UNKNOWN");
  }
}

/** Cria a promoção de desconto no agendamento ("as 30 primeiras que agendarem ganham 20%"). */
export async function createPromotionAction(input: {
  name?: string;
  discountKind: string;
  discountValue: string;
  serviceIds: string[];
  startsOn?: string;
  endsOn?: string;
  maxClients?: string;
}): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const parsed = parsePromotionDraft({
    ...input,
    discount: parseDiscount(input.discountKind, input.discountValue),
    serviceIds: Array.isArray(input.serviceIds) ? input.serviceIds.map(String) : [],
  });
  if (!parsed.ok) return fail("VALIDATION", parsed.field);
  try {
    const id = await withTenant(tenantId, (tx) => createPromotion(tx, tenantId, parsed.draft));
    if (!id) return fail("VALIDATION", "serviceIds");
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Pausar, retomar ou encerrar uma promoção de desconto ou pausar/retomar a venda de um pacote. */
export async function promotionControlAction(input: {
  target: "promotion" | "package";
  id: string;
  action: "pause" | "resume" | "end";
}): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = z
    .object({
      target: z.enum(["promotion", "package"]),
      id: z.string().uuid(),
      action: z.enum(["pause", "resume", "end"]),
    })
    .safeParse(input);
  if (!p.success || (p.data.target === "package" && p.data.action === "end")) return fail("VALIDATION");
  const { target, id, action } = p.data;
  try {
    const done = await withTenant(tenantId, async (tx) =>
      target === "package"
        ? setTemplatePaused(tx, id, action === "pause")
        : action === "end"
          ? endPromotion(tx, id)
          : setPromotionPaused(tx, id, action === "pause"),
    );
    if (!done) return fail("NOT_FOUND");
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export type RunningPromotion = Pick<
  PromotionView,
  "id" | "name" | "discount" | "serviceIds" | "label" | "left" | "maxClients"
>;

/** Promoções valendo hoje, para a folha de agendar mostrar e aplicar (a vaga de verdade é contada ao salvar). */
export async function loadRunningPromotions(): Promise<ActionResult<RunningPromotion[]>> {
  const { tenantId } = await requireTenant();
  try {
    const today = todayStr();
    const rows = await withTenant(tenantId, (tx) => listPromotions(tx));
    return ok(
      rows
        .map((p) => promotionView(p, today))
        .filter((p) => p.status === "running")
        .map(({ id, name, discount, serviceIds, label, left, maxClients }) => ({
          id,
          name,
          discount,
          serviceIds,
          label,
          left,
          maxClients,
        })),
    );
  } catch {
    return fail("UNKNOWN");
  }
}
