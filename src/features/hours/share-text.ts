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

/** Corpo "agenda aberta": semanas (🌟 1ª Semana) e uma linha por dia "01/12 - 09:00 | 10:00 (blindagem)". */
function agendaBody(days: ShareDay[], marks?: ShareMarks): string {
  const weeks = new Map<string, ShareDay[]>();
  for (const d of days) {
    const key = mondayOf(d.date as string);
    weeks.set(key, [...(weeks.get(key) ?? []), d]);
  }
  return [...weeks.values()]
    .map((list, i) => {
      const lines = list.map((d) => {
        const date = d.date as string;
        const times = d.slots.map((t) => (marks?.keys.has(markKey(date, t)) ? `${t} (${marks.tag})` : t));
        return `${date.slice(8)}/${date.slice(5, 7)} - ${times.join(" | ")}`;
      });
      return `🌟 ${i + 1}ª Semana\n\n${lines.join("\n\n")}`;
    })
    .join("\n\n");
}

/** Corpo "padrão" (WhatsApp): dia em negrito (*ter, 10/11*) e uma linha por período com faixas contínuas. */
function standardBody(days: ShareDay[]): string {
  return days
    .map((d) => {
      const lines = PERIODS.map((p) => {
        const inPeriod = d.slots.filter((t) => toMin(t) >= p.from && toMin(t) < p.to);
        return inPeriod.length ? `${p.name}: ${joinPt(toRanges(inPeriod))}` : null;
      }).filter(Boolean);
      return `*${d.label}*\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

const filledDays = (days: ShareDay[]) => days.filter((d) => d.slots.length > 0);
/** "agenda" precisa da data de cada dia; sem ela, cai no padrão. */
const isAgenda = (format: ShareFormat, days: ShareDay[]) => format === "agenda" && days.every((d) => d.date);

/** Só os horários (meio do texto). Vazio quando nenhum dia tem vaga. */
export function buildShareBody(days: ShareDay[], format: ShareFormat = "padrao", marks?: ShareMarks): string {
  const filled = filledDays(days);
  if (filled.length === 0) return "";
  return isAgenda(format, filled) ? agendaBody(filled, marks) : standardBody(filled);
}

/** Sugestões de título (topo do texto); a primeira é a usada por padrão. */
export function shareTitles(format: ShareFormat, serviceName: string, days: ShareDay[]): string[] {
  const first = filledDays(days).find((d) => d.date)?.date;
  const month = first ? monthName(first) : null;
  if (format === "agenda" && month) {
    return [
      `✨ Agenda de ${month} Aberta ✨`,
      ...(month === "Dezembro" ? [`🎅🏻 Agenda de ${month} Aberta 🎁`] : []),
      `💅 Agenda de ${month} aberta para ${serviceName}`,
      "🌟 Novos horários disponíveis!",
    ];
  }
  return [
    `Horários disponíveis para ${serviceName}:`,
    `💅 Vagas abertas para ${serviceName}`,
    "🌸 Ainda tenho horários esta semana!",
  ];
}

/** Sugestões de rodapé (fim do texto); a primeira é a usada por padrão. Com horários marcados, entra a legenda. */
export function shareFooters(format: ShareFormat, marks?: ShareMarks): string[] {
  const cta = "✨ Garanta seu horário com antecedência!";
  const legend =
    format === "agenda" && marks?.keys.size
      ? `📌 Os horários com (${marks.tag}) são exclusivos para esse procedimento. Os demais horários atendem todos os procedimentos.`
      : null;
  const list = format === "agenda" ? [cta, "Qual prefere? 💜"] : ["Qual prefere?", cta];
  return [...(legend ? [`${list[0]}\n\n${legend}`] : []), ...list, "💬 Me chama aqui para reservar o seu!"];
}

/** Junta topo, horários e rodapé com uma linha em branco entre eles; partes vazias somem. */
export const composeShareText = (title: string, body: string, footer: string) =>
  body.trim()
    ? [title, body, footer]
        .map((x) => x.trim())
        .filter(Boolean)
        .join("\n\n")
    : "";

/** Texto completo com o título e o rodapé padrão do formato. */
export function buildShareText(
  serviceName: string,
  days: ShareDay[],
  format: ShareFormat = "padrao",
  marks?: ShareMarks,
): string {
  const f = isAgenda(format, filledDays(days)) ? format : "padrao";
  const body = buildShareBody(days, f, marks);
  return composeShareText(shareTitles(f, serviceName, days)[0], body, shareFooters(f, marks)[0]);
}
