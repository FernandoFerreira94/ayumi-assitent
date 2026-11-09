import { addDays } from "@/lib/dates";
import { weekdayOf } from "@/features/hours/slots";

export const isMonthStr = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export const isYearStr = (s: string) => /^\d{4}$/.test(s);

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const pad = (n: number) => String(n).padStart(2, "0");

/** Último dia (YYYY-MM-DD) do mês `YYYY-MM`. */
export const lastDayOf = (month: string) => {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return addDays(m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`, -1);
};

/** Mês vizinho (`delta` = ±1) como `YYYY-MM`. */
export function shiftMonth(month: string, delta: number): string {
  const idx = Number(month.slice(0, 4)) * 12 + (Number(month.slice(5, 7)) - 1) + delta;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}

/**
 * Semanas do mês, de domingo a sábado. Dias de fora do mês vêm como null,
 * para a grade ficar em branco antes do dia 1 e depois do último, como no iPhone.
 */
export function monthWeeks(month: string): (string | null)[][] {
  const first = `${month}-01`;
  const last = lastDayOf(month);
  const start = addDays(first, -weekdayOf(first));
  const weeks: (string | null)[][] = [];
  for (let day = start; day <= last; day = addDays(day, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(day, i);
        return d >= first && d <= last ? d : null;
      }),
    );
  }
  return weeks;
}

export type CalendarView =
  { kind: "year"; year: string } | { kind: "month"; month: string } | { kind: "day"; date: string };

/** Lê os parâmetros da URL: ?v=ano&y=2026, ?v=mes&m=2026-11 ou ?d=2026-11-08 (padrão: o mês de hoje). */
export function parseView(
  params: { v?: string; y?: string; m?: string; d?: string },
  today: string,
  isDate: (s: string) => boolean,
): CalendarView {
  if (params.v === "ano") return { kind: "year", year: params.y && isYearStr(params.y) ? params.y : today.slice(0, 4) };
  if (params.v === "mes")
    return { kind: "month", month: params.m && isMonthStr(params.m) ? params.m : today.slice(0, 7) };
  if (params.d && isDate(params.d)) return { kind: "day", date: params.d };
  return { kind: "month", month: today.slice(0, 7) };
}
