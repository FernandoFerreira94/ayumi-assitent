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
