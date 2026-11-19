"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "./payment";

/** Mesmo visual das pílulas de desconto da folha de agendar. */
const chip =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-bold transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";

/**
 * "Já pagou?" + forma (opcional). Controlado por fora (folha do pagamento) ou solto dentro de um
 * <form> (folha de agendar), quando manda os campos "paid" e "paymentMethod".
 */
export function PaymentFields({
  paid: paidProp,
  method: methodProp,
  onChange,
  form = false,
}: {
  paid?: boolean;
  method?: PaymentMethod | null;
  onChange?: (v: { paid: boolean; method: PaymentMethod | null }) => void;
  /** Dentro da folha de agendar: grava os campos escondidos para o FormData. */
  form?: boolean;
}) {
  const [own, setOwn] = useState({ paid: paidProp ?? false, method: methodProp ?? null });
  const paid = paidProp ?? own.paid;
  const method = methodProp !== undefined ? methodProp : own.method;
  const set = (v: { paid: boolean; method: PaymentMethod | null }) => {
    setOwn(v);
    onChange?.(v);
  };

  return (
    <fieldset className="grid gap-2">
      <legend className="pb-1 text-sm font-bold">Pagamento</legend>
      {form ? (
        <>
          <input type="hidden" name="paid" value={paid ? "1" : ""} />
          <input type="hidden" name="paymentMethod" value={paid && method ? method : ""} />
        </>
      ) : null}
      <div className="flex gap-2" role="group" aria-label="Já pagou?">
        <button type="button" aria-pressed={!paid} onClick={() => set({ paid: false, method: null })} className={chip}>
          A pagar
        </button>
        <button type="button" aria-pressed={paid} onClick={() => set({ paid: true, method })} className={chip}>
          <Icon name="checkCircle" size={18} />
          Já pagou
        </button>
      </div>
      {paid ? (
        <div className="grid gap-1">
          <p className="text-xs font-bold text-muted">Forma (opcional)</p>
          <div className="flex gap-2" role="group" aria-label="Forma de pagamento">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={method === m}
                // tocar de novo tira a escolha
                onClick={() => set({ paid: true, method: method === m ? null : m })}
                className={chip}
              >
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
