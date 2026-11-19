"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PaymentSheet } from "@/features/appointments/PaymentSheet";
import { formatBRL, formatTime } from "@/lib/dates";
import type { PaymentItem } from "./payments";

const day = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
const tab =
  "flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-bold aria-selected:bg-surface aria-selected:shadow-sm";

/**
 * Lista do Financeiro: "Entrou no caixa" do mês, "A pagar" e "Adiantado" (pago antes ou sinal); tocar numa linha
 * abre a folha do pagamento. Quem deu sinal aparece nas duas abas (o que falta e o que já pagou).
 */
export function PaymentList({
  toPay,
  advance,
  toPayCents,
  advanceCents,
  cashCents,
}: {
  toPay: PaymentItem[];
  advance: PaymentItem[];
  toPayCents: number;
  advanceCents: number;
  /** Dinheiro que entrou no mês (pagamentos − devoluções, pela data em que entrou) */
  cashCents: number;
}) {
  const [view, setView] = useState<"toPay" | "advance">("toPay");
  const list = view === "toPay" ? toPay : advance;

  return (
    <>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="col-span-2 rounded-2xl bg-ok-bg px-4 py-3">
          <dt className="text-xs font-bold text-ok">Entrou no caixa</dt>
          <dd className="text-2xl font-bold tabular-nums text-ok">{formatBRL(cashCents)}</dd>
          <dd className="text-xs font-semibold text-muted">Pagamentos do mês, pela data em que o dinheiro entrou</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-muted">A pagar</dt>
          <dd className="text-lg font-bold tabular-nums">{formatBRL(toPayCents)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-muted">Adiantado e sinais</dt>
          <dd className="text-lg font-bold tabular-nums text-ok">{formatBRL(advanceCents)}</dd>
        </div>
      </dl>
      <div role="tablist" aria-label="Pagamentos" className="flex gap-1 rounded-full bg-soft p-1">
        <button type="button" role="tab" aria-selected={view === "toPay"} onClick={() => setView("toPay")} className={tab}>
          A pagar <span className="text-muted">{toPay.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "advance"}
          onClick={() => setView("advance")}
          className={tab}
        >
          Adiantado <span className="text-muted">{advance.length}</span>
        </button>
      </div>
      {list.length === 0 ? (
        <p className="py-2 text-center text-sm font-semibold text-muted">
          {view === "toPay" ? "Ninguém com pagamento em aberto nesse mês." : "Nenhum pagamento adiantado nesse mês."}
        </p>
      ) : (
        <ul role="tabpanel" className="divide-y divide-line">
          {list.map((x) => (
            <li key={x.id}>
              <PaymentSheet
                id={x.id}
                clientName={x.clientName}
                price={formatBRL(x.priceCents)}
                payment={x.payment}
                triggerClassName="flex min-h-14 w-full items-center gap-3 py-2 text-left"
              >
                <span className="w-14 shrink-0 text-xs font-bold text-muted tabular-nums">
                  {day.format(x.startsAt)}
                  <span className="block">{formatTime(x.startsAt)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{x.clientName}</span>
                  <span className="block truncate text-xs font-semibold text-muted">
                    {x.payment.state === "unpaid" ? x.serviceName : x.payment.label}
                  </span>
                </span>
                <span className="font-bold tabular-nums">
                  {formatBRL(view === "toPay" ? x.payment.remainingCents : x.payment.paidCents)}
                </span>
                <Icon
                  name={view === "toPay" ? "wallet" : "checkCircle"}
                  size={18}
                  className={view === "toPay" ? "text-primary-text" : "text-ok"}
                />
              </PaymentSheet>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
