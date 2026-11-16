import { todayStr } from "@/lib/dates";

/**
 * Separa itens (atendimentos ou bloqueios) nas colunas dos dias, pelo dia do começo no fuso do estúdio.
 * Fica fora o que não cai em nenhum dos `days`. Puro, para teste.
 */
export function spreadByDay<T extends { startsAt: Date }>(rows: T[], days: string[]): T[][] {
  const index = new Map(days.map((d, i) => [d, i]));
  const cols: T[][] = days.map(() => []);
  for (const r of rows) {
    const i = index.get(todayStr(r.startsAt));
    if (i !== undefined) cols[i].push(r);
  }
  return cols;
}
