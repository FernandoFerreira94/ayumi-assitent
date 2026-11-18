import { forecastCents, receivedCents } from "@/features/appointments/core";
import type { Status } from "@/features/appointments/schema";
import { todayStr } from "@/lib/dates";
import { shiftMonth } from "./period";

/** Os `n` meses que terminam em `ym` (inclusive), do mais antigo ao mais novo. */
export const monthsUpTo = (ym: string, n: number) => Array.from({ length: n }, (_, i) => shiftMonth(ym, i - n + 1));

type Appt = { startsAt: Date; priceCents: number; status: Status };
type Expense = { spentOn: string; amountCents: number };

export type MonthPoint = { ym: string; received: number; forecast: number; spent: number };

/** Recebido, previsto e gasto de cada mês (fuso do estúdio). Puro, para teste. */
export function byMonth(months: string[], appts: Appt[], expenses: Expense[]): MonthPoint[] {
  return months.map((ym) => {
    const rows = appts.filter((a) => todayStr(a.startsAt).startsWith(ym));
    return {
      ym,
      received: receivedCents(rows),
      forecast: forecastCents(rows),
      spent: expenses.filter((e) => e.spentOn.startsWith(ym)).reduce((s, e) => s + e.amountCents, 0),
    };
  });
}

type ClientAppt = Appt & { clientId: string; clientName: string };

/** Quem mais trouxe no mês (só concluídos): valor e visitas. */
export function topClients(rows: ClientAppt[], n = 5) {
  const map = new Map<string, { id: string; name: string; cents: number; visits: number }>();
  for (const r of rows) {
    if (r.status !== "done") continue;
    const cur = map.get(r.clientId) ?? { id: r.clientId, name: r.clientName, cents: 0, visits: 0 };
    cur.cents += r.priceCents;
    cur.visits++;
    map.set(r.clientId, cur);
  }
  return [...map.values()].sort((a, b) => b.cents - a.cents || b.visits - a.visits).slice(0, n);
}

/** Faltas do mês: entre o que já aconteceu (concluído + faltou), quantas faltaram e quanto deixou de entrar. */
export function noShows(rows: Appt[]) {
  const done = rows.filter((r) => r.status === "done").length;
  const missed = rows.filter((r) => r.status === "no_show");
  const base = done + missed.length;
  return {
    count: missed.length,
    pct: base ? Math.round((missed.length / base) * 100) : null,
    lostCents: missed.reduce((s, r) => s + r.priceCents, 0),
  };
}
