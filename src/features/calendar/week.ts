import { dragSpan } from "@/features/appointments/agenda-grid";
import type { Span } from "@/features/appointments/timeline";
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

/**
 * Onde o atendimento cai ao soltar na semana: o dia pela distância na horizontal (troca de coluna
 * passando da metade) e o horário pela vertical, de 15 em 15, preso à semana e à janela da grade.
 */
export function weekDrop(g: {
  fromCol: number;
  from: Span;
  dx: number;
  dy: number;
  colWidth: number;
  pxPerMin: number;
  win: Span;
}): { col: number; span: Span } {
  const col = Math.max(0, Math.min(6, g.fromCol + Math.round(g.dx / g.colWidth)));
  return { col, span: dragSpan("move", g.from, g.dy / g.pxPerMin, g.win) };
}
