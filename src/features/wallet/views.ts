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
  /** quanto a cliente economiza (sessões × preço do serviço − preço do pacote) */
  saveCents: number;
};

/** Modelo com preço de hoje, frase pronta e situação da promoção. */
export function templateView(t: TemplateRow, defaultDays: number, today: string): TemplateView {
  const ref = referenceService(t.services) ?? { priceCents: t.servicePriceCents };
  const priced = packagePrice(t, ref.priceCents);
  return {
    ...t,
    pricedCents: priced,
    saveCents: Math.max(0, t.sessionsTotal * ref.priceCents - priced),
    preview: packagePreview(t, t.services, t.validDays ?? defaultDays, formatBRL),
    promo: promoLine(t, t.soldClients, dayMonth),
    status: promoStatus(t, today, t.soldClients),
  };
}
