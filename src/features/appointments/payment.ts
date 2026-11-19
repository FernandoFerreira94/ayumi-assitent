/**
 * Pagamento da cliente no agendamento (manual: a dona marca). Regras puras, sem banco.
 * Sem marcação, um atendimento concluído conta como pago no dia (é o "recebido" do Financeiro).
 */
export const PAYMENT_METHODS = ["pix", "dinheiro", "cartao"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

/** advance = pagou antes de começar; paid = marcado, no dia ou depois; on_service = concluído sem marcação. */
export type PaymentState = "advance" | "paid" | "on_service" | "unpaid";

export function paymentState(a: { paidAt: Date | null; startsAt: Date; status: string }): PaymentState {
  if (a.paidAt) return a.paidAt.getTime() < a.startsAt.getTime() ? "advance" : "paid";
  return a.status === "done" ? "on_service" : "unpaid";
}

const STATE_LABEL: Record<PaymentState, string> = {
  advance: "Pago adiantado",
  paid: "Pago",
  on_service: "Pago no atendimento",
  unpaid: "A pagar",
};

/** Texto do selo: "Pago adiantado · Pix", "A pagar"… */
export function paymentLabel(state: PaymentState, method: PaymentMethod | null): string {
  return method && (state === "advance" || state === "paid")
    ? `${STATE_LABEL[state]} · ${METHOD_LABEL[method]}`
    : STATE_LABEL[state];
}

export const isMethod = (v: unknown): v is PaymentMethod =>
  typeof v === "string" && (PAYMENT_METHODS as readonly string[]).includes(v);

/**
 * Lê o pagamento da folha de agendar: campo "paid" = "1" marca pago; "paymentMethod" é opcional.
 * Sem "paid", a forma é ignorada (a dona pode ter escolhido e desmarcado).
 */
export function parsePayment(paid: unknown, method: unknown): { method: PaymentMethod | null } | null {
  if (paid !== "1") return null;
  return { method: isMethod(method) ? method : null };
}

/** Para o selo nas telas: já formatado e com o estado, para a cor. */
export type PaymentView = { state: PaymentState; label: string; method: PaymentMethod | null };

export function paymentView(a: {
  paidAt: Date | null;
  startsAt: Date;
  status: string;
  paymentMethod: PaymentMethod | null;
}): PaymentView {
  const state = paymentState(a);
  return { state, label: paymentLabel(state, a.paymentMethod), method: a.paymentMethod };
}
