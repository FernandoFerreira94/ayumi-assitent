import "server-only";
import { demoEvents, demoHealth, demoMrr, demoOverview, demoPayments } from "./demo-data";
import { requireAdmin } from "./guard";
import type { BillingHealth, MrrMonthRow, OverviewRow, PaymentRow, SubscriptionEventRow } from "./types";

/**
 * Leituras do painel do dono. Cada uma confere o admin de novo (defesa em profundidade: a página já conferiu).
 * HOJE devolvem DADOS DE EXEMPLO (demo-data.ts), porque as tabelas de cobrança ainda não estão na main.
 * O Bloco 2 troca o corpo por SQL nas views (withAdmin + papel bubbly_admin), sem mudar a assinatura.
 */
export const IS_DEMO = true;

export async function getOverview(now = new Date()): Promise<OverviewRow[]> {
  await requireAdmin();
  return demoOverview(now);
}

export async function getMrrMonths(now = new Date()): Promise<MrrMonthRow[]> {
  await requireAdmin();
  return demoMrr(now);
}

/** month = 'YYYY-MM' (já validado por quem chama). */
export async function getPayments(month: string, now = new Date()): Promise<PaymentRow[]> {
  await requireAdmin();
  return demoPayments(now, month);
}

export async function getEvents(now = new Date()): Promise<SubscriptionEventRow[]> {
  await requireAdmin();
  return demoEvents(now);
}

export async function getBillingHealth(now = new Date()): Promise<BillingHealth> {
  await requireAdmin();
  return demoHealth(now);
}
