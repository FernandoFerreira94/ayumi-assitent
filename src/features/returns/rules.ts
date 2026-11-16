import { addDays } from "@/lib/dates";

/**
 * Regras puras do retorno da cliente (sem banco).
 * O retorno de um atendimento é o menor `returnDays` entre os serviços dele: quem fez unha (15) e
 * escova (30) volta primeiro pela unha.
 */

/** Menor retorno entre os serviços; null se nenhum tem retorno. */
export function returnDaysOf(services: { returnDays: number | null }[]): number | null {
  const days = services.map((s) => s.returnDays).filter((n): n is number => typeof n === "number" && n > 0);
  return days.length ? Math.min(...days) : null;
}

/** Data prevista do retorno (`YYYY-MM-DD`, fuso do estúdio) contada do dia do atendimento. */
export function returnDue(doneOn: string, services: { returnDays: number | null }[]): string | null {
  const days = returnDaysOf(services);
  return days === null ? null : addDays(doneOn, days);
}

/** Dias corridos entre duas datas `YYYY-MM-DD` (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/**
 * Dias candidatos ao retorno: de 2 antes a 5 depois da data prevista, nunca hoje nem antes
 * (o retorno atrasado começa amanhã). Em ordem de proximidade com a data prevista.
 */
export function returnWindow(due: string, today: string): string[] {
  const start = daysBetween(today, due) < 3 ? addDays(today, 1) : addDays(due, -2);
  const days = Array.from({ length: 8 }, (_, i) => addDays(start, i));
  const center = days.includes(due) ? due : start;
  return days.sort((a, b) => Math.abs(daysBetween(center, a)) - Math.abs(daysBetween(center, b)) || a.localeCompare(b));
}

export type ReturnDay = { date: string; slots: string[] };

/** `n` horários espalhados pelo dia (o primeiro, os do meio e o último), para ter manhã e tarde. */
export function spread(slots: string[], n: number): string[] {
  if (slots.length <= n) return slots;
  if (n === 1) return [slots[0]];
  return Array.from({ length: n }, (_, i) => slots[Math.round((i * (slots.length - 1)) / (n - 1))]);
}

/**
 * Até `maxDays` dias com vaga, os mais perto da data prevista, mostrados em ordem de data,
 * com `perDay` horários livres de cada um, espalhados pelo dia. `slotsOf` calcula as vagas do dia.
 */
export function pickReturnDays(
  window: string[],
  slotsOf: (date: string) => string[],
  { maxDays = 4, perDay = 3 } = {},
): ReturnDay[] {
  const out: ReturnDay[] = [];
  for (const date of window) {
    if (out.length >= maxDays) break;
    const slots = slotsOf(date);
    if (slots.length) out.push({ date, slots: spread(slots, perDay) });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
