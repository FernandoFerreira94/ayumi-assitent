import { formatBRL } from "@/lib/dates";
import type { TemplateRow } from "./packages";
import { packageFacts, type PromoFacts } from "./promo-text";
import {
  autoPackageName,
  offPct,
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
  /** valor cheio (sessões × serviço) e % de desconto sobre ele */
  fullCents: number;
  offPct: number;
  /** vagas que restam (null = sem limite) */
  left: number | null;
  /** dados para o texto de divulgar (`promoText`) */
  facts: PromoFacts;
};

/** Modelo com preço de hoje, frase pronta e situação da promoção. */
export function templateView(t: TemplateRow, defaultDays: number, today: string): TemplateView {
  const ref = referenceService(t.services) ?? { priceCents: t.servicePriceCents };
  const priced = packagePrice(t, ref.priceCents);
  const full = t.sessionsTotal * ref.priceCents;
  const names = t.services.map((x) => x.name);
  const left = t.maxClients === null ? null : Math.max(0, t.maxClients - t.soldClients);
  const days = t.validDays ?? defaultDays;
  return {
    ...t,
    pricedCents: priced,
    saveCents: Math.max(0, full - priced),
    fullCents: full,
    offPct: offPct(full, priced),
    left,
    facts: packageFacts({
      ...t,
      autoName: t.name === autoPackageName(t, names),
      serviceNames: names,
      priceCents: priced,
      unitCents: ref.priceCents,
      validDays: days,
      left,
    }),
    preview: packagePreview(t, t.services, days, formatBRL),
    promo: promoLine(t, t.soldClients, dayMonth),
    status: promoStatus(t, today, t.soldClients),
  };
}
