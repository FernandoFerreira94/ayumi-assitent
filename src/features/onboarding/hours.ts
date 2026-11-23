import type { Day } from "@/features/hours/slots";

/** Expediente que já vem marcado na entrada: seg–sex, 9h às 18h, almoço 12h–13h (0 = domingo). */
export const ENTRY_DEFAULT_WEEK: Day[] = [
  null,
  ...Array.from({ length: 5 }, () => ({ opens: "09:00", closes: "18:00", breakStart: "12:00", breakEnd: "13:00" })),
  null,
];

/** Horário editado na tela: um por dia da semana (0 = domingo) e uma pausa só, como no formulário de Ajustes. */
export type HoursDraft = {
  days: { open: boolean; opens: string; closes: string }[];
  breakOn: boolean;
  breakStart: string;
  breakEnd: string;
};

export function draftFromWeek(week: Day[]): HoursDraft {
  const firstOpen = week.find((d) => d);
  const pause = week.find((d) => d?.breakStart && d.breakEnd);
  return {
    days: week.map((d) => ({
      open: !!d,
      opens: d?.opens ?? firstOpen?.opens ?? "09:00",
      closes: d?.closes ?? firstOpen?.closes ?? "18:00",
    })),
    breakOn: !!pause,
    breakStart: pause?.breakStart ?? "12:00",
    breakEnd: pause?.breakEnd ?? "13:00",
  };
}

/** Campos do mesmo formulário de Ajustes › Expediente, para a ação `saveWorkingHours` salvar no mesmo lugar. */
export function draftToFormData(draft: HoursDraft): FormData {
  const fd = new FormData();
  if (draft.breakOn) fd.set("break-on", "on");
  fd.set("break-start", draft.breakStart);
  fd.set("break-end", draft.breakEnd);
  draft.days.forEach((d, i) => {
    if (d.open) fd.set(`open-${i}`, "on");
    fd.set(`opens-${i}`, d.opens);
    fd.set(`closes-${i}`, d.closes);
  });
  return fd;
}

/** O expediente que a ação vai salvar: a pausa só vale nos dias em que cabe dentro do horário. */
export function draftToWeek(draft: HoursDraft): Day[] {
  return draft.days.map((d) => {
    if (!d.open) return null;
    const fits = draft.breakOn && draft.breakStart >= d.opens && draft.breakEnd <= d.closes;
    return {
      opens: d.opens,
      closes: d.closes,
      breakStart: fits ? draft.breakStart : null,
      breakEnd: fits ? draft.breakEnd : null,
    };
  });
}

const SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
/** Segunda primeiro, como se lê a semana. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** "09:00" → "9h", "09:30" → "9h30". */
export function hourLabel(t: string): string {
  const h = Number(t.slice(0, 2));
  const m = t.slice(3, 5);
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

function dayRanges(indices: number[]): string {
  const runs: number[][] = [];
  for (const i of indices) {
    const last = runs.at(-1);
    if (last && WEEK_ORDER.indexOf(i) === WEEK_ORDER.indexOf(last.at(-1)!) + 1) last.push(i);
    else runs.push([i]);
  }
  return runs
    .map((r) =>
      r.length === 1
        ? SHORT[r[0]]
        : r.length === 2
          ? `${SHORT[r[0]]} e ${SHORT[r[1]]}`
          : `${SHORT[r[0]]} a ${SHORT[r.at(-1)!]}`,
    )
    .join(", ");
}

/** "Seg a Sex · 9h às 18h · almoço 12h–13h". Dias com horários diferentes viram grupos separados por ponto e vírgula. */
export function describeHours(week: Day[]): string {
  const groups = new Map<string, number[]>();
  for (const i of WEEK_ORDER) {
    const d = week[i];
    if (!d) continue;
    const key = [d.opens, d.closes, d.breakStart ?? "", d.breakEnd ?? ""].join("|");
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  if (groups.size === 0) return "Sem dias de atendimento";
  return [...groups.entries()]
    .map(([key, days]) => {
      const [opens, closes, bs, be] = key.split("|");
      const pause = bs && be ? ` · almoço ${hourLabel(bs)}–${hourLabel(be)}` : "";
      return `${dayRanges(days)} · ${hourLabel(opens)} às ${hourLabel(closes)}${pause}`;
    })
    .join("; ");
}
