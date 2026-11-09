import { dayRange, formatMonthYear } from "@/lib/dates";

/** Primeiro dia do mês que está `n` meses depois do mês de `date`. */
function monthStart(date: string, n = 0): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7)) - 1 + n;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, "0")}-01`;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const isMonth = (v: unknown): v is string => typeof v === "string" && MONTH.test(v);

/** Soma `n` meses a um "YYYY-MM". */
export function shiftMonth(ym: string, n: number): string {
  return monthStart(`${ym}-01`, n).slice(0, 7);
}

/**
 * Mês "YYYY-MM": instantes (para agendamentos) e datas (para gastos), fim exclusivo.
 */
export function monthRange(ym: string): { range: [Date, Date]; dates: [string, string]; label: string } {
  const first = `${ym}-01`;
  const next = monthStart(first, 1);
  return { range: [dayRange(first)[0], dayRange(next)[0]], dates: [first, next], label: formatMonthYear(first) };
}
