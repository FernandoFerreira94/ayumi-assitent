// Brasil não tem horário de verão desde 2019: o estúdio usa UTC-3 fixo (America/Sao_Paulo).
const OFFSET = "-03:00";
const TZ = "America/Sao_Paulo";

export const isDateStr = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00${OFFSET}`));

/** Data de hoje (YYYY-MM-DD) no fuso do estúdio. */
export function todayStr(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00${OFFSET}`);
  d.setUTCDate(d.getUTCDate() + n);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Início (inclusivo) e fim (exclusivo) do dia no fuso do estúdio. */
export function dayRange(date: string): [Date, Date] {
  return [new Date(`${date}T00:00:00${OFFSET}`), new Date(`${addDays(date, 1)}T00:00:00${OFFSET}`)];
}

/** Combina data e hora locais (YYYY-MM-DD + HH:mm) em um instante. */
export const toInstant = (date: string, time: string) => new Date(`${date}T${time}:00${OFFSET}`);

export const formatTime = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

export const formatDayTitle = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${date}T12:00:00${OFFSET}`),
  );

/** "Novembro de 2026": o mês do dia escolhido, já que a faixa de dias só mostra o número. */
export const formatMonthYear = (date: string) => {
  const s = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, month: "long", year: "numeric" }).format(
    new Date(`${date}T12:00:00${OFFSET}`),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Saudação pelo horário do estúdio, com o primeiro nome quando houver. */
export function greeting(now: Date, name?: string | null): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(now)) % 24;
  const base = hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${base}, ${first}` : base;
}

export const formatBRL =(cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
