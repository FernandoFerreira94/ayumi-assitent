/**
 * Histórico da cliente: regras puras (sem banco). Junta atendimentos, pacotes e dinheiro numa linha do tempo,
 * do mais novo ao mais velho, com cursor para carregar aos poucos.
 */

import type { Status } from "@/features/appointments/schema";
import { remainingCents } from "@/features/wallet/rules";

export const HISTORY_FILTERS = ["all", "visits", "plans", "payments", "no_show"] as const;
export type HistoryFilter = (typeof HISTORY_FILTERS)[number];

export const HISTORY_FILTER_LABEL: Record<HistoryFilter, string> = {
  all: "Tudo",
  visits: "Atendimentos",
  plans: "Planos",
  payments: "Pagamentos",
  no_show: "Faltas",
};

export const HISTORY_PAGE = 20;

/** Posição na linha do tempo: instante + id (desempate de itens no mesmo instante). */
export type Cursor = { at: Date; id: string };

export const encodeCursor = (c: Cursor) => `${c.at.toISOString()}|${c.id}`;

export function decodeCursor(s: string | null | undefined): Cursor | null {
  if (!s) return null;
  const [iso, id] = s.split("|");
  if (!iso || !id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? null : { at, id };
}

/** a vem antes de b na linha do tempo (mais novo primeiro; no mesmo instante, maior id primeiro). */
export const newerFirst = (a: Cursor, b: Cursor) =>
  b.at.getTime() - a.at.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

/**
 * Junta as listas (cada uma já ordenada e com no máximo `size + 1` itens depois do cursor) e corta a página.
 * `next` = cursor do último item mostrado quando ainda há mais.
 */
export function mergePage<T extends Cursor>(lists: readonly (readonly T[])[], size = HISTORY_PAGE) {
  const all = lists.flat().sort(newerFirst);
  const items = all.slice(0, size);
  const last = items.at(-1);
  return { items, next: all.length > size && last ? encodeCursor(last) : null };
}

export const STATUS_LABEL: Record<Status, string> = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  done: "Compareceu",
  no_show: "Faltou",
  cancelled: "Cancelado",
  reschedule_requested: "Pediu para remarcar",
};

export type Tone = "ok" | "wait" | "fail" | "muted" | "info";

export function statusTone(status: Status, future: boolean): Tone {
  if (status === "done") return "ok";
  if (status === "no_show") return "fail";
  if (status === "cancelled") return "muted";
  if (status === "reschedule_requested") return "wait";
  return future ? "info" : "wait";
}

/** Texto do pagamento do atendimento ("Pago", "Sinal R$ X · falta R$ Y", "A pagar R$ X"); null quando não se aplica. */
export function visitPaymentLine(
  status: Status,
  priceCents: number,
  paidCents: number,
  brl: (c: number) => string,
): { text: string; tone: Tone } | null {
  if (status === "cancelled" || status === "no_show" || priceCents <= 0) return null;
  const left = remainingCents(priceCents, paidCents);
  if (left === 0) return { text: "Pago", tone: "ok" };
  if (paidCents > 0) return { text: `Sinal ${brl(paidCents)} · falta ${brl(left)}`, tone: "wait" };
  return { text: `A pagar ${brl(left)}`, tone: "wait" };
}

export type MoneyKind = "payment" | "refund" | "credit_in" | "credit_use" | "retained" | "expire";
export const MONEY_KINDS: readonly MoneyKind[] = ["payment", "refund", "credit_in", "credit_use", "retained", "expire"];

/**
 * Nome do movimento de dinheiro na linha do tempo. Pagamento de atendimento menor que o preço é sinal;
 * pagamento sem atendimento e sem pacote é crédito lançado.
 */
export function moneyLabel(m: {
  kind: MoneyKind;
  amountCents: number;
  appointmentPriceCents: number | null;
  packageName: string | null;
  reason: string | null;
}): string {
  switch (m.kind) {
    case "payment":
      if (m.packageName) return `Pagou o pacote ${m.packageName}`;
      if (m.appointmentPriceCents === null) return "Crédito lançado";
      if (m.reason) return m.reason;
      return m.amountCents < m.appointmentPriceCents ? "Sinal" : "Pagamento";
    case "refund":
      return "Devolvido à cliente";
    case "credit_in":
      return "Virou crédito";
    case "credit_use":
      return "Usou crédito";
    case "retained":
      return "Sinal ficou para o salão";
    case "expire":
      return "Crédito venceu";
  }
}

/** Sinal do valor na tela: o que entrou (+) ou saiu (−) do ponto de vista do salão. */
export const moneySign = (kind: MoneyKind): 1 | -1 => (kind === "refund" || kind === "expire" ? -1 : 1);

export const METHOD_LABEL: Record<"pix" | "dinheiro" | "cartao", string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

/** % das vezes que veio (concluídos ÷ concluídos + faltas); null sem nada para medir. */
export function attendanceRate(done: number, noShows: number): number | null {
  const total = done + noShows;
  return total ? Math.round((done / total) * 100) : null;
}
