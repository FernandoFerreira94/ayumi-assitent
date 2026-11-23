import { formatBRL } from "@/lib/dates";
import type { TemplateRow } from "./packages";
import { packageFacts, type PromoFacts } from "./promo-text";
import type { PromotionRow } from "./promotions";
import {
  discountLabel,
  promotionFacts,
  promotionOffer,
  promotionStatus,
  type PromotionStatus,
} from "./promotion-rules";
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

export type PromotionView = Omit<PromotionRow, "createdAt"> & {
  status: PromotionStatus;
  /** "20% de desconto em Esmaltação" */
  offer: string;
  /** "20%" ou "R$ 15,00" */
  label: string;
  /** vagas que restam (null = sem limite) */
  left: number | null;
  /** "De 01/12 a 31/12" (vazio sem período) */
  period: string;
  facts: PromoFacts;
};

/** Promoção com situação de hoje, vagas e o texto para divulgar. */
export function promotionView(p: PromotionRow, today: string): PromotionView {
  const { createdAt: _created, ...rest } = p;
  void _created;
  const left = p.maxClients === null ? null : Math.max(0, p.maxClients - p.used);
  return {
    ...rest,
    status: promotionStatus(p, today, p.used),
    offer: promotionOffer(
      p.discount,
      p.services.map((s) => s.name),
    ),
    label: discountLabel(p.discount),
    left,
    period: promoLine({ startsOn: p.startsOn, endsOn: p.endsOn, maxClients: null }, null, dayMonth),
    facts: promotionFacts({ ...p, left }),
  };
}
