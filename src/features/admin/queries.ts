import "server-only";
import { requireAdmin } from "./guard";
import type { BillingHealth, MrrMonthRow, OverviewRow, PaymentRow, SubscriptionEventRow } from "./types";

/**
 * Leituras de COBRANÇA do painel do dono. Cada uma confere o admin de novo (defesa em profundidade).
 * As tabelas de cobrança (planos, assinaturas, pagamentos) ainda não estão na main: enquanto BILLING_LIVE = false,
 * as funções devolvem vazio e as telas mostram estado vazio honesto (nunca número inventado).
 * O Bloco 2 troca o corpo por SQL nas views (withAdmin + papel bubbly_admin) e liga BILLING_LIVE, sem mudar a assinatura.
 * Números reais que não dependem da cobrança: platform.ts (visão geral) e usage.ts (tela Uso).
 */
export const BILLING_LIVE = false;

export async function getOverview(): Promise<OverviewRow[]> {
  await requireAdmin();
  return [];
}

export async function getMrrMonths(): Promise<MrrMonthRow[]> {
  await requireAdmin();
  return [];
}

/** month = 'YYYY-MM' (já validado por quem chama). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- o mês filtra a consulta do Bloco 2
export async function getPayments(month: string): Promise<PaymentRow[]> {
  await requireAdmin();
  return [];
}

export async function getEvents(): Promise<SubscriptionEventRow[]> {
  await requireAdmin();
  return [];
}

export async function getBillingHealth(): Promise<BillingHealth> {
  await requireAdmin();
  return { lastEventAt: null, pendingCount: 0, failed24h: 0, oldestPendingAt: null };
}
