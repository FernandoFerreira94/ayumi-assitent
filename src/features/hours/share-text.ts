const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/** Horários que se emendam (de `stepMin` em `stepMin`) viram faixas: "09:00 às 11:30". Sozinho, fica "13:00". */
export function toRanges(slots: string[], stepMin = 30): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < slots.length) {
    let j = i;
    while (j + 1 < slots.length && toMin(slots[j + 1]) - toMin(slots[j]) === stepMin) j++;
    out.push(j === i ? slots[i] : `${slots[i]} às ${slots[j]}`);
    i = j + 1;
  }
  return out;
}

const joinPt = (parts: string[]) =>
  parts.length < 2 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;

const PERIODS = [
  { name: "Manhã", from: 0, to: 12 * 60 },
  { name: "Tarde", from: 12 * 60, to: 18 * 60 },
  { name: "Noite", from: 18 * 60, to: 24 * 60 },
];

export type ShareFormat = "padrao" | "agenda";
/** Horários marcados à mão ("AAAA-MM-DD|HH:mm") e o rótulo que vai ao lado, ex.: "10:00 (blindagem)". */
export type ShareMarks = { tag: string; keys: ReadonlySet<string> };
export const markKey = (date: string, time: string) => `${date}|${time}`;
export type ShareDay = { label: string; slots: string[]; date?: string };

const monthName = (date: string) => {
  const m = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long" }).format(new Date(`${date}T12:00:00Z`));
  return m.charAt(0).toUpperCase() + m.slice(1);
};

/** Segunda-feira da semana de uma data AAAA-MM-DD (para agrupar "1ª Semana", "2ª Semana"). */
function mondayOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * Formato "agenda aberta": título com mês, semanas (🌟 1ª Semana), uma linha por dia
 * "01/12 - 09:00 | 10:00" e rodapé. Dias sem `date` caem no formato padrão.
 */
function buildAgendaText(days: ShareDay[], marks?: ShareMarks): string {
  const withDate = days.filter((d) => d.date);
  const weeks = new Map<string, ShareDay[]>();
  for (const d of withDate) {
    const key = mondayOf(d.date as string);
    weeks.set(key, [...(weeks.get(key) ?? []), d]);
  }
  const month = monthName(withDate[0].date as string);
  const blocks = [...weeks.values()].map((list, i) => {
    const lines = list.map((d) => {
      const date = d.date as string;
      const times = d.slots.map((t) => (marks?.keys.has(markKey(date, t)) ? `${t} (${marks.tag})` : t));
      return `${date.slice(8)}/${date.slice(5, 7)} - ${times.join(" | ")}`;
    });
    return `🌟 ${i + 1}ª Semana\n\n${lines.join("\n\n")}`;
  });
  return `✨ Agenda de ${month} Aberta ✨\n\n${blocks.join("\n\n")}\n\n✨ Garanta seu horário com antecedência!`;
}

/**
 * Texto para divulgar as vagas. "padrao" (WhatsApp): dia em negrito (*ter, 10/11*), uma linha por período
 * com faixas contínuas e uma linha em branco entre os dias. "agenda": formato de agenda aberta por semana.
 */
export function buildShareText(
  serviceName: string,
  days: ShareDay[],
  format: ShareFormat = "padrao",
  marks?: ShareMarks,
): string {
  const filled = days.filter((d) => d.slots.length > 0);
  if (filled.length === 0) return "";
  if (format === "agenda" && filled.every((d) => d.date)) return buildAgendaText(filled, marks);
  const blocks = filled.map((d) => {
    const lines = PERIODS.map((p) => {
      const inPeriod = d.slots.filter((t) => toMin(t) >= p.from && toMin(t) < p.to);
      return inPeriod.length ? `${p.name}: ${joinPt(toRanges(inPeriod))}` : null;
    }).filter(Boolean);
    return `*${d.label}*\n${lines.join("\n")}`;
  });
  return `Horários disponíveis para ${serviceName}:\n\n${blocks.join("\n\n")}\n\nQual prefere?`;
}
