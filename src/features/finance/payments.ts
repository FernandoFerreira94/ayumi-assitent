import { paymentView, type PaymentMethod, type PaymentView } from "@/features/appointments/payment";

type Row = {
  id: string;
  startsAt: Date;
  status: string;
  priceCents: number;
  clientName: string;
  serviceName: string;
  paidAt: Date | null;
  paymentMethod: PaymentMethod | null;
  /** Do extrato da carteira (sinal ou tudo) */
  paidCents?: number;
};

export type PaymentItem = {
  id: string;
  startsAt: Date;
  clientName: string;
  serviceName: string;
  priceCents: number;
  payment: PaymentView;
};

/**
 * Pagamentos das clientes no mês: quem ainda vai pagar (atendimento em aberto, sem marcação ou só com sinal) e o que
 * já entrou adiantado (pago tudo antes, ou o sinal). Quem deu sinal aparece nas duas listas: o que falta em "A pagar"
 * e o sinal em "Adiantado". Falta e cancelado não entram; concluído conta como pago no atendimento.
 */
export function splitPayments(rows: Row[]) {
  const toPay: PaymentItem[] = [];
  const advance: PaymentItem[] = [];
  let toPayCents = 0;
  let advanceCents = 0;
  for (const r of rows) {
    if (r.status === "no_show" || r.status === "cancelled") continue;
    const item = {
      id: r.id,
      startsAt: r.startsAt,
      clientName: r.clientName,
      serviceName: r.serviceName,
      priceCents: r.priceCents,
      payment: paymentView(r),
    };
    const { state, paidCents, remainingCents } = item.payment;
    if (state === "unpaid" || state === "deposit") {
      toPay.push(item);
      toPayCents += remainingCents;
    }
    if (state === "advance" || state === "deposit") {
      advance.push(item);
      advanceCents += paidCents;
    }
  }
  return { toPay, advance, toPayCents, advanceCents };
}
