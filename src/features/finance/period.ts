import { weekdayOf } from "@/features/hours/slots";
import { addDays, dayRange, formatMonthYear } from "@/lib/dates";

export const PERIODS = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "semestre", label: "Semestre" },
] as const;
export type Period = (typeof PERIODS)[number]["id"];

export const isPeriod = (v: unknown): v is Period => PERIODS.some((p) => p.id === v);

const short = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short" });
const dm = (date: string) => short.format(new Date(`${date}T12:00:00-03:00`)).replace(".", "");

/** Primeiro dia do mês que está `n` meses depois do mês de `date`. */
function monthStart(date: string, n = 0): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7)) - 1 + n;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, "0")}-01`;
}

/**
 * Período do calendário que contém `today`, no fuso do estúdio: semana de segunda a domingo,
 * semestre de janeiro a junho ou de julho a dezembro. Fim exclusivo.
 */
export function periodRange(p: Period, today: string): { range: [Date, Date]; label: string } {
  switch (p) {
    case "dia":
      return { range: dayRange(today), label: "Hoje" };
    case "semana": {
      const monday = addDays(today, -((weekdayOf(today) + 6) % 7));
      return {
        range: [dayRange(monday)[0], dayRange(addDays(monday, 7))[0]],
        label: `${dm(monday)} a ${dm(addDays(monday, 6))}`,
      };
    }
    case "mes": {
      const first = monthStart(today);
      return { range: [dayRange(first)[0], dayRange(monthStart(today, 1))[0]], label: formatMonthYear(today) };
    }
    case "semestre": {
      const second = Number(today.slice(5, 7)) > 6;
      const first = `${today.slice(0, 4)}-${second ? "07" : "01"}-01`;
      return {
        range: [dayRange(first)[0], dayRange(monthStart(first, 6))[0]],
        label: `${second ? "2º" : "1º"} semestre de ${today.slice(0, 4)}`,
      };
    }
  }
}
