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
 * Pagamentos das clientes no mês: quem ainda vai pagar (atendimento em aberto, sem marcação) e quem
 * já pagou adiantado. Falta não entra; concluído sem marcação conta como pago no atendimento (fora das duas listas).
 */
export function splitPayments(rows: Row[]) {
  const toPay: PaymentItem[] = [];
  const advance: PaymentItem[] = [];
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
    if (item.payment.state === "unpaid") toPay.push(item);
    else if (item.payment.state === "advance") advance.push(item);
  }
  const sum = (l: PaymentItem[]) => l.reduce((t, x) => t + x.priceCents, 0);
  return { toPay, advance, toPayCents: sum(toPay), advanceCents: sum(advance) };
}
