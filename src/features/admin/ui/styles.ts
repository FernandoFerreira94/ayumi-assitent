/** Campo do painel: 16 px ou mais (sem zoom do iOS), foco visível, borda vermelha quando inválido. */
export const adminInput =
  "min-h-13 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base font-semibold transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_4px_var(--soft)] focus:outline-none aria-invalid:border-fail";

export const adminCard = "grid gap-4 rounded-3xl border border-line bg-surface p-5 shadow-[0_8px_24px_-16px_rgba(23,20,43,0.25)]";

/** Cor do número em destaque: roxo da marca, verde (entrou), vermelho (problema), âmbar (atenção) ou tinta. */
export type Highlight = "brand" | "ok" | "fail" | "wait" | "fg";
export const HIGHLIGHT: Record<Highlight, string> = {
  brand: "text-primary-text",
  ok: "text-ok",
  fail: "text-fail",
  wait: "text-wait",
  fg: "text-fg",
};

/** Número de destaque dentro de listas e tabelas: fonte da marca, sem quebrar e alinhado. */
export const adminFigure = "font-brand tracking-[-0.01em] tabular-nums";
