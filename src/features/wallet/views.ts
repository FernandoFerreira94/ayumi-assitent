import { formatBRL } from "@/lib/dates";
import type { TemplateRow } from "./packages";
import {
  dayMonth,
  packagePreview,
  packagePrice,
  promoLine,
  promoStatus,
  referenceService,
  type PromoStatus,
} from "./rules";

export type TemplateView = TemplateRow & {
  pricedCents: number;
  preview: string;
  /** "De 01/12 a 31/12 · 12 de 30 clientes" (vazio sem período nem limite) */
  promo: string;
  status: PromoStatus;
};

/** Modelo com preço de hoje, frase pronta e situação da promoção. */
export function templateView(t: TemplateRow, defaultDays: number, today: string): TemplateView {
  const ref = referenceService(t.services) ?? { priceCents: t.servicePriceCents };
  return {
    ...t,
    pricedCents: packagePrice(t, ref.priceCents),
    preview: packagePreview(t, t.services, t.validDays ?? defaultDays, formatBRL),
    promo: promoLine(t, t.soldClients, dayMonth),
    status: promoStatus(t, today, t.soldClients),
  };
}
