import type { BillingHealth, OverviewRow, PaymentRow, SubscriptionEventRow } from "./types";

export type Summary = {
  mrrCents: number;
  mrrAtRiskCents: number;
  payingCount: number;
  courtesyCount: number;
  trialCount: number;
  trialsEndingSoon: number;
  pastDueCount: number;
  readOnlyCount: number;
  arpaCents: number | null;
};
export type Bucket = { label: "1–7 dias" | "8–30 dias" | "30+ dias"; count: number; mrrCents: number };
export type Received = {
  grossCents: number;
  feeCents: number;
  netCents: number;
  refundedCents: number;
  approvedCount: number;
};

const PAID = new Set(["active", "past_due"]);
const DAY = 86_400_000;

/** Números da visão geral. MRR = active + past_due (trial fora); cortesia Fundadora (valor 0) não é pagante. */
export function summarize(rows: OverviewRow[], now: Date): Summary {
  const paying = rows.filter((r) => PAID.has(r.status) && r.mrrCents > 0);
  const mrrCents = paying.reduce((s, r) => s + r.mrrCents, 0);
  return {
    mrrCents,
    mrrAtRiskCents: paying.filter((r) => r.status === "past_due").reduce((s, r) => s + r.mrrCents, 0),
    payingCount: paying.length,
    courtesyCount: rows.filter((r) => r.founder && r.amountCents === 0 && PAID.has(r.status)).length,
    trialCount: rows.filter((r) => r.status === "trialing").length,
    trialsEndingSoon: rows.filter(
      (r) =>
        r.status === "trialing" &&
        r.trialEndsAt &&
        r.trialEndsAt.getTime() >= now.getTime() &&
        r.trialEndsAt.getTime() - now.getTime() <= 3 * DAY,
    ).length,
    pastDueCount: rows.filter((r) => r.status === "past_due").length,
    readOnlyCount: rows.filter((r) => r.status === "read_only").length,
    arpaCents: paying.length ? Math.round(mrrCents / paying.length) : null,
  };
}

const BUCKETS = [
  { label: "1–7 dias", min: 1, max: 7 },
  { label: "8–30 dias", min: 8, max: 30 },
  { label: "30+ dias", min: 31, max: Infinity },
] as const;

/** Quem deve e há quanto tempo, em faixas, com o valor mensal somado. */
export function delinquencyBuckets(rows: OverviewRow[]): Bucket[] {
  const late = rows.filter((r) => (r.daysPastDue ?? 0) > 0);
  return BUCKETS.map(({ label, min, max }) => {
    const inB = late.filter((r) => r.daysPastDue! >= min && r.daysPastDue! <= max);
    return { label, count: inB.length, mrrCents: inB.reduce((s, r) => s + r.mrrCents, 0) };
  });
}

/** Quem vence nos próximos N dias, do mais perto ao mais longe (sem quem cancela no fim do período). */
export function upcomingDue(rows: OverviewRow[], now: Date, days: number): OverviewRow[] {
  const end = now.getTime() + days * DAY;
  return rows
    .filter(
      (r) =>
        r.nextDueAt && !r.cancelAtPeriodEnd && r.nextDueAt.getTime() >= now.getTime() && r.nextDueAt.getTime() <= end,
    )
    .sort((a, b) => a.nextDueAt!.getTime() - b.nextDueAt!.getTime());
}

/** Totais do mês: bruto e taxa dos aprovados (líquido = bruto − taxa), estorno e chargeback à parte. */
export function receivedInMonth(payments: PaymentRow[]): Received {
  const ok = payments.filter((p) => p.status === "approved");
  const back = payments.filter((p) => p.status === "refunded" || p.status === "charged_back");
  const grossCents = ok.reduce((s, p) => s + p.amountCents, 0);
  const feeCents = ok.reduce((s, p) => s + (p.feeCents ?? 0), 0);
  return {
    grossCents,
    feeCents,
    netCents: grossCents - feeCents,
    refundedCents: back.reduce((s, p) => s + p.amountCents, 0),
    approvedCount: ok.length,
  };
}

/** Fim do trial vira 'activated' (pagou) ou 'read_only' (não pagou); cada salão conta uma vez no período. */
export function trialConversion(events: SubscriptionEventRow[], from: Date, to: Date) {
  const ends = events.filter((e) => (e.kind === "activated" || e.kind === "read_only") && e.at >= from && e.at <= to);
  const byTenant = new Map(ends.map((e) => [e.tenantId, e.kind]));
  const ended = byTenant.size;
  const converted = [...byTenant.values()].filter((k) => k === "activated").length;
  return { ended, converted, rate: ended ? converted / ended : null };
}

export type HealthLevel = "ok" | "warn" | "fail";

/**
 * Saúde da cobrança (webhooks do Mercado Pago). Vermelho: falha nas últimas 24 h ou evento parado há mais de 1 h.
 * Laranja: evento na fila, ou nenhum evento há mais de 2 dias (pode ser webhook desligado). Verde: o resto.
 */
export function healthLevel(h: BillingHealth, now: Date): HealthLevel {
  if (h.failed24h > 0) return "fail";
  if (h.oldestPendingAt && now.getTime() - h.oldestPendingAt.getTime() > 3_600_000) return "fail";
  if (h.pendingCount > 0) return "warn";
  if (!h.lastEventAt || now.getTime() - h.lastEventAt.getTime() > 2 * DAY) return "warn";
  return "ok";
}

/** Cancelamentos (canceled) com data dentro do período, do mais novo ao mais antigo. */
export function cancellations(events: SubscriptionEventRow[], from: Date, to: Date): SubscriptionEventRow[] {
  return events.filter((e) => e.kind === "canceled" && e.at >= from && e.at <= to).sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** Testes que acabam nos próximos N dias, do mais perto ao mais longe. */
export function trialsEnding(rows: OverviewRow[], now: Date, days: number): OverviewRow[] {
  const end = now.getTime() + days * DAY;
  return rows
    .filter((r) => r.status === "trialing" && r.trialEndsAt && r.trialEndsAt.getTime() >= now.getTime() && r.trialEndsAt.getTime() <= end)
    .sort((a, b) => a.trialEndsAt!.getTime() - b.trialEndsAt!.getTime());
}
