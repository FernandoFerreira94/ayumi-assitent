/**
 * Quando cada aviso do dia sai (regra pura, testável). O worker roda a cada 5 minutos e pergunta "o que está na
 * hora agora?"; a tabela owner_notices garante uma vez só por tipo e dia.
 */
export type NoticeKind = "morning" | "day_end" | "week" | "holiday";

export type DayInput = {
  /** Minutos desde 00:00 no fuso do estúdio */
  nowMin: number;
  /** 0 = domingo */
  weekday: number;
  /** Expediente do dia em minutos; null = dia sem expediente */
  hours: { opens: number; closes: number } | null;
  /** Atendimentos do dia que ainda valem (sem cancelados e faltas), em minutos locais */
  appts: { start: number; end: number }[];
  /** Um bloqueio cobre o expediente inteiro (folga avulsa, férias) */
  fullDayBlock: boolean;
  /** Amanhã é data boa para mandar carinho às clientes */
  greetTomorrow: boolean;
};

export const LATE_MIN = 19 * 60;
const END_WINDOW = 3 * 60;

export const isDayOff = (d: { hours: unknown; appts: readonly unknown[]; fullDayBlock: boolean }) =>
  !d.hours || (d.appts.length === 0 && d.fullDayBlock);

/** Fim real do dia: o maior entre o fechamento e o fim do último atendimento. */
export function dayEndMin(d: Pick<DayInput, "hours" | "appts">): number | null {
  if (!d.hours) return null;
  return Math.max(d.hours.closes, ...d.appts.map((a) => a.end));
}

export function dueNotices(d: DayInput): { kind: NoticeKind; tomorrow: boolean }[] {
  const out: { kind: NoticeKind; tomorrow: boolean }[] = [];
  const m = d.nowMin;
  // Folga não manda aviso: o sistema só fala quando há trabalho no dia
  if (!isDayOff(d) && d.hours) {
    if (d.appts.length) {
      const first = Math.min(...d.appts.map((a) => a.start));
      // Duas horas antes da primeira cliente (se ela chega cedo, o aviso sai mais cedo também)
      if (m >= first - 120 && m < first) out.push({ kind: "morning", tomorrow: false });
    } else {
      const from = Math.max(7 * 60, d.hours.opens - 60);
      if (m >= from && m < d.hours.closes) out.push({ kind: "morning", tomorrow: false });
    }
    const end = dayEndMin(d)!;
    if (end < 24 * 60 && m >= end && m < end + END_WINDOW) out.push({ kind: "day_end", tomorrow: false });
  }
  // Domingo à noite: roteiro da semana que começa amanhã
  if (d.weekday === 0 && m >= 19 * 60 && m < 23 * 60) out.push({ kind: "week", tomorrow: true });
  if (d.greetTomorrow && m >= 10 * 60 && m < 20 * 60) out.push({ kind: "holiday", tomorrow: true });
  return out;
}

export const toMin = (hhmm: string) => {
  const [h, mm] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (mm ?? 0);
};
