import { z } from "zod";
import { addDays, formatDayTitle, isDateStr } from "@/lib/dates";
import { weekdayOf } from "./slots";

/** Turnos do filtro "Personalizada": começa a valer pelo horário de INÍCIO da vaga. */
export const SHIFTS = [
  { value: "morning", label: "Manhã", from: 0, to: 12 * 60 },
  { value: "afternoon", label: "Tarde", from: 12 * 60, to: 18 * 60 },
  { value: "evening", label: "Noite", from: 18 * 60, to: 24 * 60 },
] as const;
export type Shift = (typeof SHIFTS)[number]["value"];

export const MAX_DAYS = 93;
export const MAX_MONTH_OFFSET = 5;

export const customConfigSchema = z.object({
  /** null = primeiro serviço da lista de vagas */
  serviceId: z.string().uuid().nullable(),
  period: z.discriminatedUnion("kind", [
    // monthOffset: 0 = mês de hoje, 1 = mês seguinte... (assim a lista salva continua valendo no mês que vem)
    z.object({ kind: z.literal("month"), monthOffset: z.number().int().min(0).max(MAX_MONTH_OFFSET) }),
    z.object({
      kind: z.literal("weeks"),
      monthOffset: z.number().int().min(0).max(MAX_MONTH_OFFSET),
      weeks: z.array(z.number().int().min(1).max(6)).max(6),
    }),
    z.object({ kind: z.literal("days"), dates: z.array(z.string().refine(isDateStr)).max(MAX_DAYS) }),
  ]),
  /** 0 = domingo. Vazio = todos os dias da semana. */
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  /** Vazio = o dia todo. */
  shifts: z.array(z.enum(["morning", "afternoon", "evening"])).max(3),
});
export type CustomConfig = z.infer<typeof customConfigSchema>;
export type CustomPeriod = CustomConfig["period"];

export const DEFAULT_CONFIG: CustomConfig = {
  serviceId: null,
  period: { kind: "month", monthOffset: 0 },
  weekdays: [],
  shifts: [],
};

/** Primeiro dia (AAAA-MM-01) do mês `offset` meses depois do mês de `today`. */
export function monthStart(today: string, offset: number): string {
  const total = Number(today.slice(0, 4)) * 12 + (Number(today.slice(5, 7)) - 1) + offset;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

/** Todos os dias do mês de `first` (AAAA-MM-01). */
export function monthDates(first: string): string[] {
  const out: string[] = [];
  for (let d = first; d.slice(0, 7) === first.slice(0, 7); d = addDays(d, 1)) out.push(d);
  return out;
}

/** Segunda-feira da semana de uma data. */
function mondayOf(date: string): string {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

/** Semanas do mês (de segunda a domingo): a 1ª é a que contém o dia 1. */
export function monthWeeks(first: string): string[][] {
  const map = new Map<string, string[]>();
  for (const d of monthDates(first)) {
    const k = mondayOf(d);
    map.set(k, [...(map.get(k) ?? []), d]);
  }
  return [...map.values()];
}

/** Dias do período escolhido, em ordem, sem datas que já passaram. */
export function resolveDates(period: CustomPeriod, today: string): string[] {
  let dates: string[];
  if (period.kind === "days") dates = [...new Set(period.dates)].sort();
  else {
    const first = monthStart(today, period.monthOffset);
    dates =
      period.kind === "month"
        ? monthDates(first)
        : monthWeeks(first)
            .filter((_, i) => period.weeks.includes(i + 1))
            .flat();
  }
  return dates.filter((d) => d >= today).slice(0, MAX_DAYS);
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/** Filtros de dia da semana e turno aplicados às vagas de um dia. */
export function filterDaySlots(date: string, slots: string[], f: Pick<CustomConfig, "weekdays" | "shifts">): string[] {
  if (f.weekdays.length && !f.weekdays.includes(weekdayOf(date))) return [];
  if (!f.shifts.length) return slots;
  const ranges = SHIFTS.filter((s) => f.shifts.includes(s.value));
  return slots.filter((t) => ranges.some((r) => toMin(t) >= r.from && toMin(t) < r.to));
}

/** "ter, 10/11": o rótulo curto do dia usado em Vagas e no texto. */
export const shortDayLabel = (date: string) =>
  `${formatDayTitle(date).split(",")[0].slice(0, 3)}, ${date.slice(8)}/${date.slice(5, 7)}`;

/** Leitura segura de uma config salva; devolve null se estiver quebrada. */
export function parseConfig(raw: unknown): CustomConfig | null {
  const r = customConfigSchema.safeParse(raw);
  return r.success ? r.data : null;
}

export type CustomDay = { date: string; label: string; slots: string[] };
export type SavedSlotList = { id: string; name: string; config: CustomConfig };
