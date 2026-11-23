import type { UsageRow } from "./usage-rules";

/** Totais reais da plataforma no mês corrente (São Paulo). Só contagens. */
export type PlatformTotals = {
  clients: number;
  users: number;
  apptsMonth: number;
  apptsPrevMonth: number;
  msgsOutMonth: number;
  msgsInMonth: number;
};

/** Um mês da série de 12 (month = 'YYYY-MM-01'): salões novos e agendamentos sem cancelados. */
export type PlatformMonth = { month: string; salons: number; appts: number };

const DAY = 86_400_000;

/** Variação contra o mês anterior; null quando não há base (mês anterior zerado). */
export function pctChange(cur: number, prev: number): number | null {
  return prev > 0 ? (cur - prev) / prev : null;
}

/** Salões cadastrados nos últimos N dias, do mais novo ao mais antigo. */
export function recentSalons(rows: UsageRow[], now: Date, days: number): UsageRow[] {
  const from = now.getTime() - days * DAY;
  return rows.filter((r) => r.createdAt.getTime() >= from).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Salões parados: sem uso há mais de N dias (ou nunca usaram), cadastrados há mais de N dias.
 * Do parado há mais tempo ao mais recente (nunca usou vem primeiro). Pede contato antes de virar cancelamento.
 */
export function idleSalons(rows: UsageRow[], now: Date, days: number): UsageRow[] {
  const limit = now.getTime() - days * DAY;
  return rows
    .filter((r) => r.createdAt.getTime() < limit && (!r.lastSeenAt || r.lastSeenAt.getTime() < limit))
    .sort((a, b) => (a.lastSeenAt?.getTime() ?? 0) - (b.lastSeenAt?.getTime() ?? 0));
}

/** Dias inteiros desde a data (para "há N dias"). */
export function daysSince(d: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / DAY));
}
