/**
 * Promoção de desconto no agendamento (0054), regras puras. Ex.: "as 30 primeiras clientes que agendarem ganham
 * 20% em Esmaltação". Decisões (as mais simples): 1 uso por cliente; cancelar libera a vaga; não soma com desconto
 * digitado à mão nem com sessão de pacote; com mais de uma valendo, entra a que dá o maior desconto.
 */

import { applyDiscount, type Discount } from "@/features/appointments/pricing";
import { formatBRL } from "@/lib/dates";
import { periodText, type PromoFacts } from "./promo-text";
import { serviceNames } from "./rules";

export type PromotionStatus = "running" | "scheduled" | "paused" | "ended" | "sold_out";

export type PromotionCore = {
  discount: Discount;
  serviceIds: string[];
  startsOn: string | null;
  endsOn: string | null;
  maxClients: number | null;
  paused: boolean;
  ended: boolean;
};

/**
 * Situação hoje: "ended" = vencida (passou do fim do período), "paused" = desativada pela dona (o antigo
 * "Encerrar", `ended`, conta como desativada e volta ao reativar). Vencida e esgotada vêm antes de desativada.
 */
export function promotionStatus(p: Omit<PromotionCore, "discount" | "serviceIds">, today: string, used: number) {
  if (p.endsOn && today > p.endsOn) return "ended" as const;
  if (p.maxClients !== null && used >= p.maxClients) return "sold_out" as const;
  if (p.paused || p.ended) return "paused" as const;
  if (p.startsOn && today < p.startsOn) return "scheduled" as const;
  return "running" as const;
}

/** Desconto em centavos no agendamento: só sobre os serviços da promoção (o % vale sobre a soma deles). */
export function promotionOffCents(
  p: Pick<PromotionCore, "discount" | "serviceIds">,
  booked: readonly { id: string; priceCents: number }[],
): number {
  const base = booked.filter((s) => p.serviceIds.includes(s.id)).reduce((c, s) => c + s.priceCents, 0);
  return base > 0 ? applyDiscount(base, p.discount).discountCents : 0;
}

/** A que dá o maior desconto entre as que valem (null = nenhuma cobre os serviços). */
export function bestPromotion<T extends Pick<PromotionCore, "discount" | "serviceIds">>(
  list: readonly T[],
  booked: readonly { id: string; priceCents: number }[],
): { promo: T; offCents: number } | null {
  let best: { promo: T; offCents: number } | null = null;
  for (const promo of list) {
    const offCents = promotionOffCents(promo, booked);
    if (offCents > 0 && (!best || offCents > best.offCents)) best = { promo, offCents };
  }
  return best;
}

/** "20%" ou "R$ 15,00". */
export const discountLabel = (d: Discount) =>
  d.kind === "pct" ? `${d.value}%` : formatBRL(d.value).replace(/\u00a0/g, " ");

/** "20% de desconto em Esmaltação ou Pé" */
export const promotionOffer = (d: Discount, names: readonly string[]) =>
  `${discountLabel(d)} de desconto em ${serviceNames(names)}`;

/** Fatos para o texto de divulgar. O de/por usa o serviço mais caro da promoção (1 sessão). */
export function promotionFacts(p: {
  name: string | null;
  discount: Discount;
  services: readonly { name: string; priceCents: number }[];
  startsOn: string | null;
  endsOn: string | null;
  maxClients: number | null;
  left: number | null;
}): PromoFacts {
  const top = p.services.reduce<{ priceCents: number } | null>(
    (a, b) => (!a || b.priceCents > a.priceCents ? b : a),
    null,
  );
  const full = p.services.length === 1 && top ? top.priceCents : 0;
  return {
    title: p.name,
    offer: promotionOffer(
      p.discount,
      p.services.map((s) => s.name),
    ),
    fullCents: full,
    priceCents: full ? applyDiscount(full, p.discount).totalCents : 0,
    when: periodText(p.startsOn, p.endsOn),
    maxClients: p.maxClients,
    left: p.left,
    extra: p.maxClients !== null ? "Vale 1 vez por cliente, no agendamento." : null,
    cta: "Agende o seu horário",
  };
}

export type PromotionDraft = {
  name: string | null;
  discount: Discount;
  serviceIds: string[];
  startsOn: string | null;
  endsOn: string | null;
  maxClients: number | null;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/i;

/** Lê o formulário da promoção. Devolve o campo errado quando algo não fecha. */
export function parsePromotionDraft(raw: {
  name?: string;
  discount: Discount | null | "invalid";
  serviceIds?: string[];
  startsOn?: string;
  endsOn?: string;
  maxClients?: string;
}): { ok: true; draft: PromotionDraft } | { ok: false; field: string } {
  const name = (raw.name ?? "").trim();
  if (name.length > 60) return { ok: false, field: "name" };
  const d = raw.discount;
  if (!d || d === "invalid" || (d.kind === "pct" && d.value > 99)) return { ok: false, field: "discount" };
  const serviceIds = [...new Set(raw.serviceIds ?? [])];
  if (serviceIds.length < 1 || serviceIds.length > 30 || !serviceIds.every((id) => UUID.test(id)))
    return { ok: false, field: "serviceIds" };
  const startsOn = raw.startsOn?.trim() || null;
  const endsOn = raw.endsOn?.trim() || null;
  if (startsOn && !DAY.test(startsOn)) return { ok: false, field: "startsOn" };
  if (endsOn && (!DAY.test(endsOn) || (startsOn && endsOn < startsOn))) return { ok: false, field: "endsOn" };
  const capRaw = raw.maxClients?.trim();
  const maxClients = capRaw ? Number(capRaw) : null;
  if (maxClients !== null && (!Number.isInteger(maxClients) || maxClients < 1 || maxClients > 10_000))
    return { ok: false, field: "maxClients" };
  return { ok: true, draft: { name: name || null, discount: d, serviceIds, startsOn, endsOn, maxClients } };
}
