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

/**
 * Texto para divulgar as vagas (WhatsApp): dia em negrito (*ter, 10/11*), uma linha por período
 * com faixas contínuas e uma linha em branco entre os dias.
 */
export function buildShareText(serviceName: string, days: { label: string; slots: string[] }[]): string {
  const blocks = days
    .filter((d) => d.slots.length > 0)
    .map((d) => {
      const lines = PERIODS.map((p) => {
        const inPeriod = d.slots.filter((t) => toMin(t) >= p.from && toMin(t) < p.to);
        return inPeriod.length ? `${p.name}: ${joinPt(toRanges(inPeriod))}` : null;
      }).filter(Boolean);
      return `*${d.label}*\n${lines.join("\n")}`;
    });
  if (blocks.length === 0) return "";
  return `Horários disponíveis para ${serviceName}:\n\n${blocks.join("\n\n")}\n\nQual prefere?`;
}
