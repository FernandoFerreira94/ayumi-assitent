import { unclearPattern, type UnclearDecision, type UnclearLabel } from "./unclear";

export type UnclearRow = {
  id: string;
  salon: string;
  body: string;
  question: "reminder" | "ambiguous";
  aiIntent: string | null;
  decision: UnclearDecision;
  label: UnclearLabel | null;
  createdAt: Date;
};

export type UnclearGroup = {
  pattern: string;
  /** Texto mais recente do grupo, como exemplo. */
  example: string;
  ids: string[];
  count: number;
  salons: string[];
  last: Date;
  /** Rótulo mais recente dado a alguma mensagem do grupo. */
  label: UnclearLabel | null;
  aiIntent: string | null;
  decision: UnclearDecision;
};

/** Junta mensagens parecidas (mesmo padrão). Sem rótulo primeiro, depois as mais frequentes e recentes. */
export function groupUnclear(rows: UnclearRow[]): UnclearGroup[] {
  const map = new Map<string, UnclearGroup>();
  for (const r of [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    const key = unclearPattern(r.body) || r.body;
    const g = map.get(key);
    if (!g) {
      map.set(key, {
        pattern: key,
        example: r.body,
        ids: [r.id],
        count: 1,
        salons: [r.salon],
        last: r.createdAt,
        label: r.label,
        aiIntent: r.aiIntent,
        decision: r.decision,
      });
      continue;
    }
    g.ids.push(r.id);
    g.count++;
    if (!g.salons.includes(r.salon)) g.salons.push(r.salon);
    g.label ??= r.label;
  }
  return [...map.values()].sort(
    (a, b) =>
      Number(a.label !== null) - Number(b.label !== null) || b.count - a.count || b.last.getTime() - a.last.getTime(),
  );
}
