import { formatBRL } from "@/lib/dates";
import { parseDiscount } from "./pricing";

/**
 * Pagamento da cliente no agendamento (manual: a dona marca). Regras puras, sem banco.
 * Sem marcação, um atendimento concluído conta como pago no dia (é o "recebido" do Financeiro).
 * Sinal (19/11): pago parte antes; `paidCents` vem do extrato da carteira (features/wallet).
 */
export const PAYMENT_METHODS = ["pix", "dinheiro", "cartao"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

/**
 * advance = pagou tudo antes de começar; paid = pagou tudo, no dia ou depois; deposit = deu sinal (parte);
 * on_service = concluído sem marcação; unpaid = nada pago.
 */
export type PaymentState = "advance" | "paid" | "deposit" | "on_service" | "unpaid";

export function paymentState(a: {
  paidAt: Date | null;
  startsAt: Date;
  status: string;
  paidCents?: number;
  priceCents?: number;
}): PaymentState {
  if (a.paidAt) return a.paidAt.getTime() < a.startsAt.getTime() ? "advance" : "paid";
  if (a.status === "done") return "on_service";
  const paid = a.paidCents ?? 0;
  if (paid > 0) return paid >= (a.priceCents ?? 0) ? "paid" : "deposit";
  return "unpaid";
}

const STATE_LABEL: Record<PaymentState, string> = {
  advance: "Pago adiantado",
  paid: "Pago",
  deposit: "Sinal",
  on_service: "Pago no atendimento",
  unpaid: "A pagar",
};

/** Texto do selo: "Pago adiantado · Pix", "Sinal R$ 30 · falta R$ 70", "A pagar"… */
export function paymentLabel(
  state: PaymentState,
  method: PaymentMethod | null,
  money?: { paidCents: number; remainingCents: number },
): string {
  if (state === "deposit" && money)
    return `Sinal ${formatBRL(money.paidCents)} · falta ${formatBRL(money.remainingCents)}`;
  return method && (state === "advance" || state === "paid")
    ? `${STATE_LABEL[state]} · ${METHOD_LABEL[method]}`
    : STATE_LABEL[state];
}

export const isMethod = (v: unknown): v is PaymentMethod =>
  typeof v === "string" && (PAYMENT_METHODS as readonly string[]).includes(v);

/** Pagamento escolhido: `amountCents` null = o valor todo; um número menor que o total = sinal. */
export type PaymentInput = { method: PaymentMethod | null; amountCents?: number | null };

/**
 * Lê o pagamento da folha de agendar: "paid" = "1" (pagou tudo) ou "deposit" (sinal, valor em "depositAmount",
 * no formato 30,00). "paymentMethod" é opcional. Sem "paid", a forma é ignorada. Sinal inválido = "invalid".
 */
export function parsePayment(paid: unknown, method: unknown, amount?: unknown): PaymentInput | null | "invalid" {
  const m = isMethod(method) ? method : null;
  if (paid === "1") return { method: m };
  if (paid !== "deposit") return null;
  const v = parseDiscount("brl", amount);
  return v && v !== "invalid" ? { method: m, amountCents: v.value } : "invalid";
}

/** Para o selo nas telas: já formatado e com o estado, para a cor. */
export type PaymentView = {
  state: PaymentState;
  label: string;
  method: PaymentMethod | null;
  /** Quanto já foi pago (sinal ou tudo) e quanto falta, em centavos */
  paidCents: number;
  remainingCents: number;
};

export function paymentView(a: {
  paidAt: Date | null;
  startsAt: Date;
  status: string;
  paymentMethod: PaymentMethod | null;
  priceCents?: number;
  paidCents?: number;
}): PaymentView {
  const state = paymentState(a);
  const price = a.priceCents ?? 0;
  const full = state === "advance" || state === "paid" || state === "on_service";
  const paidCents = full ? Math.max(price, a.paidCents ?? 0) : Math.max(0, a.paidCents ?? 0);
  const remainingCents = Math.max(0, price - paidCents);
  return {
    state,
    label: paymentLabel(state, a.paymentMethod, { paidCents, remainingCents }),
    method: a.paymentMethod,
    paidCents,
    remainingCents,
  };
}
