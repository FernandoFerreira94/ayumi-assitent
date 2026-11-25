/** Filtros da lista de Clientes no desktop. Puro, para teste. */

export const CLIENT_FILTERS = {
  sumidas: "Sumidas",
  fieis: "Mais fiéis",
  novas: "Novas",
} as const;
export type ClientFilter = keyof typeof CLIENT_FILTERS;
export const isClientFilter = (v: unknown): v is ClientFilter => typeof v === "string" && v in CLIENT_FILTERS;

/** Sem vir há pelo menos isto (e sem horário marcado) = sumida. */
export const GONE_DAYS = 60;
/** Cadastrada há no máximo isto = nova. */
export const NEW_DAYS = 30;
/** "Mais fiéis" mostra até este tanto, quem mais veio primeiro. */
export const LOYAL_TOP = 20;

export type Stats = { visits: number; lastVisit: Date | null; spentCents: number; hasNext: boolean };
type Row = { id: string; createdAt: Date };

const DAY = 86_400_000;
export const daysSince = (d: Date, now: Date) => Math.floor((now.getTime() - d.getTime()) / DAY);

export function applyClientFilter<T extends Row>(
  rows: T[],
  stats: Map<string, Stats>,
  f: ClientFilter,
  now: Date,
): T[] {
  const st = (id: string) => stats.get(id);
  if (f === "sumidas")
    return rows
      .filter((r) => {
        const s = st(r.id);
        return !!s?.lastVisit && !s.hasNext && daysSince(s.lastVisit, now) >= GONE_DAYS;
      })
      .sort((a, b) => st(a.id)!.lastVisit!.getTime() - st(b.id)!.lastVisit!.getTime());
  if (f === "novas")
    return rows
      .filter((r) => daysSince(r.createdAt, now) <= NEW_DAYS)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows
    .filter((r) => (st(r.id)?.visits ?? 0) > 0)
    .sort((a, b) => st(b.id)!.visits - st(a.id)!.visits || st(b.id)!.spentCents - st(a.id)!.spentCents)
    .slice(0, LOYAL_TOP);
}

/** "8 visitas · última há 45 dias" para a linha da cliente no desktop. */
export function statsLine(s: Stats | undefined, now: Date): string {
  if (!s || s.visits === 0) return s?.hasNext ? "Primeira visita marcada" : "Ainda não veio";
  const n = s.visits === 1 ? "1 visita" : `${s.visits} visitas`;
  const d = s.lastVisit ? daysSince(s.lastVisit, now) : null;
  const last = d === null ? "" : d === 0 ? " · veio hoje" : d === 1 ? " · última ontem" : ` · última há ${d} dias`;
  return n + last;
}
