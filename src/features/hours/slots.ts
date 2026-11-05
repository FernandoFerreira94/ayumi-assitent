import { toInstant } from "@/lib/dates";

export type Day = { opens: string; closes: string } | null;
export type Busy = { startsAt: Date; endsAt: Date };

/** Expediente padrão enquanto o estúdio não configurar: seg–sáb, 09:00–18:00. */
export const DEFAULT_HOURS: Day[] = [null, ...Array.from({ length: 6 }, () => ({ opens: "09:00", closes: "18:00" }))];

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const toHHmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Dia da semana (0 = domingo) de uma data YYYY-MM-DD, independente do fuso do servidor. */
export const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

/**
 * Horários de início livres para um serviço de `durationMin` minutos.
 * Grade de `stepMin`; o atendimento inteiro precisa caber no expediente e não pode cruzar ocupados.
 * `notBefore` esconde horários que já passaram (hoje).
 */
export function freeSlots(args: {
  date: string;
  day: Day;
  durationMin: number;
  busy: Busy[];
  stepMin?: number;
  notBefore?: Date;
}): string[] {
  const { date, day, durationMin, busy, stepMin = 30, notBefore } = args;
  if (!day) return [];
  const out: string[] = [];
  for (let m = toMin(day.opens); m + durationMin <= toMin(day.closes); m += stepMin) {
    const start = toInstant(date, toHHmm(m));
    const end = new Date(start.getTime() + durationMin * 60_000);
    if (notBefore && start < notBefore) continue;
    if (busy.some((b) => start < b.endsAt && end > b.startsAt)) continue;
    out.push(toHHmm(m));
  }
  return out;
}
