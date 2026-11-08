import type { Day } from "@/features/hours/slots";
import { formatTime } from "@/lib/dates";

/** Minutos desde 00:00 no fuso do estúdio. */
export const minuteOf = (d: Date) => {
  const [h, m] = formatTime(d).split(":").map(Number);
  return h * 60 + m;
};
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
/** Lacunas menores que isso não viram "Livre": não cabe atendimento. */
const MIN_FREE = 30;

export type Span = { start: number; end: number };

/**
 * Janela da linha do dia em horas cheias: o expediente, esticado para caber
 * qualquer atendimento fora dele. Dia fechado e vazio cai em 09–18 para não sumir a grade.
 */
export function timelineWindow(day: Day, spans: Span[]): Span {
  const base = day ? { start: toMin(day.opens), end: toMin(day.closes) } : { start: 9 * 60, end: 18 * 60 };
  const start = Math.min(base.start, ...spans.map((s) => s.start));
  const end = Math.max(base.end, ...spans.map((s) => s.end));
  return { start: Math.floor(start / 60) * 60, end: Math.ceil(end / 60) * 60 };
}

/** Horários livres dentro do expediente (só dia aberto), entre os ocupados. */
export function freeGaps(day: Day, busy: Span[]): Span[] {
  if (!day) return [];
  const out: Span[] = [];
  let cursor = toMin(day.opens);
  const close = toMin(day.closes);
  for (const b of [...busy].sort((x, y) => x.start - y.start)) {
    if (b.start - cursor >= MIN_FREE) out.push({ start: cursor, end: Math.min(b.start, close) });
    cursor = Math.max(cursor, b.end);
  }
  if (close - cursor >= MIN_FREE) out.push({ start: cursor, end: close });
  return out.filter((g) => g.end - g.start >= MIN_FREE);
}

export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Duração curta para o card: "30 min", "1h", "1h30". */
export function duration({ start, end }: Span) {
  const total = end - start;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
