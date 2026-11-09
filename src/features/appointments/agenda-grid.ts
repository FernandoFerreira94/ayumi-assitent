import { addDays } from "@/lib/dates";
import { weekdayOf, type Day } from "@/features/hours/slots";
import { hhmm, type Span } from "./timeline";

/** Passo do arraste, das bolinhas e das setas do teclado. */
export const SNAP_MIN = 15;
/** A grade mostra 08h–20h; atendimento fora disso estica a janela para não sumir. */
const GRID_START = 8 * 60;
const GRID_END = 20 * 60;

export const snap = (m: number) => Math.round(m / SNAP_MIN) * SNAP_MIN;

export function gridWindow(spans: Span[]): Span {
  const start = Math.min(GRID_START, ...spans.map((s) => s.start));
  const end = Math.max(GRID_END, ...spans.map((s) => s.end));
  return { start: Math.floor(start / 60) * 60, end: Math.ceil(end / 60) * 60 };
}

/** Domingo a sábado da semana que contém `date`. */
export function weekOf(date: string): string[] {
  const sunday = addDays(date, -weekdayOf(date));
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

type Placed = Span & { id: string };

/**
 * Coluna de cada bloco quando eles se sobrepõem, como no Calendário do iPhone:
 * cada grupo de blocos encadeados divide a largura pelo número de colunas que precisou.
 */
export function layoutColumns(spans: Placed[]): Map<string, { col: number; cols: number }> {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = new Map<string, { col: number; cols: number }>();
  let group: Placed[] = [];
  let colEnds: number[] = [];
  let groupEnd = -1;
  const flush = () => {
    for (const s of group) out.get(s.id)!.cols = colEnds.length;
    group = [];
    colEnds = [];
  };
  for (const s of sorted) {
    if (s.start >= groupEnd && group.length) flush();
    let col = colEnds.findIndex((end) => end <= s.start);
    if (col < 0) col = colEnds.push(0) - 1;
    colEnds[col] = s.end;
    out.set(s.id, { col, cols: 0 });
    group.push(s);
    groupEnd = Math.max(groupEnd, s.end);
  }
  flush();
  return out;
}

export type Occupant = Span & { id: string; kind: "appointment" | "block"; label: string };

/**
 * Motivo para não aceitar `span` no dia, ou null se cabe. `hours` null = salão fechado.
 * O servidor confere de novo (sobreposição e bloqueio); aqui é para o bloco ficar vermelho na hora.
 */
export function conflictReason(span: Placed, hours: Span | null, others: Occupant[]): string | null {
  if (!hours || span.start < hours.start || span.end > hours.end) return "Fora do expediente";
  const hit = others.find((o) => o.id !== span.id && span.start < o.end && o.start < span.end);
  if (!hit) return null;
  if (hit.kind === "block") return `Choca com ${hit.label ? hit.label.toLowerCase() : "o bloqueio"}`;
  return `Choca com ${hit.label.trim().split(/\s+/)[0]} às ${hhmm(hit.start)}`;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/** Pausa fixa do dia em minutos; null = sem pausa (ou salão fechado). */
export const breakSpan = (day: Day): Span | null =>
  day?.breakStart && day.breakEnd ? { start: toMin(day.breakStart), end: toMin(day.breakEnd) } : null;

/** Expediente do dia em minutos; null = salão fechado. */
export const daySpan = (day: Day): Span | null => (day ? { start: toMin(day.opens), end: toMin(day.closes) } : null);

/**
 * Primeiro começo livre para `len` minutos a partir de `from` (o botão "Agendar"),
 * de 15 em 15. Null se o salão está fechado ou o dia não tem esse tempo livre.
 */
export function nextFree(from: number, len: number, hours: Span | null, others: Occupant[]): number | null {
  if (!hours) return null;
  for (let s = Math.max(hours.start, Math.ceil(from / 30) * 30); s + len <= hours.end; s += SNAP_MIN) {
    if (!conflictReason({ id: "", start: s, end: s + len }, hours, others)) return s;
  }
  return null;
}

export type DragMode = "move" | "top" | "bottom";

/** Novo começo e fim depois de arrastar `deltaMin`, presos à janela e com no mínimo 15 min. */
export function dragSpan(mode: DragMode, from: Span, deltaMin: number, win: Span): Span {
  const len = from.end - from.start;
  if (mode === "move") {
    const start = Math.max(win.start, Math.min(win.end - len, snap(from.start + deltaMin)));
    return { start, end: start + len };
  }
  if (mode === "bottom") {
    return { start: from.start, end: Math.max(from.start + SNAP_MIN, Math.min(win.end, snap(from.end + deltaMin))) };
  }
  return { start: Math.max(win.start, Math.min(from.end - SNAP_MIN, snap(from.start + deltaMin))), end: from.end };
}

/** Cor do bloco pelo serviço: o mesmo serviço sempre cai na mesma das 5 cores. */
export function serviceTone(serviceId: string): number {
  let h = 0;
  for (const ch of serviceId) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % 5;
}
