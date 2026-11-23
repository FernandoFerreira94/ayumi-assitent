"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { DEFAULT_POLICY, suggestedDeposit } from "@/features/wallet/rules";
import { formatBRL } from "@/lib/dates";
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "./payment";
import { parseDiscount } from "./pricing";

/** Mesmo visual das pílulas de desconto da folha de agendar. */
const chip =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-bold transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";

export type PaymentChoice = "none" | "deposit" | "full";
/** `request`: no "Sinal" da folha de agendar, pedir à cliente (padrão) em vez de "já recebi". */
export type PaymentPick = { choice: PaymentChoice; method: PaymentMethod | null; amount: string; request?: boolean };

/** "30,00" a partir de centavos, para o campo do sinal. */
export const centsToField = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
/** Centavos do campo do sinal; null se vazio ou inválido. */
export function fieldToCents(raw: string): number | null {
  const v = parseDiscount("brl", raw);
  return v && v !== "invalid" ? v.value : null;
}

/**
 * Pagamento: "A pagar", "Sinal" (parte, valor sugerido por Ajustes > Pagamentos) ou "Já pagou" (tudo), com a forma
 * opcional. Controlado por fora (folha do pagamento) ou solto dentro de um <form> (folha de agendar), quando manda
 * os campos "paid" ("" | "deposit" | "1"), "depositAmount" e "paymentMethod".
 */
export function PaymentFields({
  value,
  onChange,
  form = false,
  totalCents = 0,
  depositPct = DEFAULT_POLICY.depositPct,
  amountError = false,
  paidBefore = 0,
}: {
  value?: PaymentPick;
  onChange?: (v: PaymentPick) => void;
  /** Dentro da folha de agendar: grava os campos escondidos para o FormData. */
  form?: boolean;
  /** Total do atendimento (com desconto): sugere o sinal e mostra quanto falta. */
  totalCents?: number;
  depositPct?: number;
  amountError?: boolean;
  /** Já pago antes (na folha do pagamento): o sinal não sugere menos que isso. */
  paidBefore?: number;
}) {
  const [own, setOwn] = useState<PaymentPick>({ choice: "none", method: null, amount: "", request: true });
  const v = value ?? own;
  const set = (next: PaymentPick) => {
    setOwn(next);
    onChange?.(next);
  };
  const suggested = Math.max(paidBefore, suggestedDeposit(totalCents, depositPct));
  // Campo vazio usa a sugestão (ela muda junto com os serviços escolhidos)
  const amount = v.amount || (suggested ? centsToField(suggested) : "");
  const depositCents = fieldToCents(amount);
  const bad = amountError || (v.choice === "deposit" && amount !== "" && depositCents === null);
  const rest = depositCents !== null && totalCents > 0 ? Math.max(0, totalCents - depositCents) : null;
  // Só na folha de agendar: "Pedir à cliente" manda valor e Pix no WhatsApp e não entra no caixa
  const asking = form && v.choice === "deposit" && v.request !== false;

  return (
    <fieldset className="grid gap-2">
      <legend className="pb-1 text-sm font-bold">Pagamento</legend>
      {form ? (
        <>
          <input
            type="hidden"
            name="paid"
            value={v.choice === "full" ? "1" : asking ? "request" : v.choice === "deposit" ? "deposit" : ""}
          />
          <input type="hidden" name="depositAmount" value={v.choice === "deposit" ? amount : ""} />
          <input
            type="hidden"
            name="paymentMethod"
            value={v.choice !== "none" && !asking && v.method ? v.method : ""}
          />
        </>
      ) : null}
      <div className="flex gap-2" role="group" aria-label="Já pagou?">
        <button
          type="button"
          aria-pressed={v.choice === "none"}
          onClick={() => set({ ...v, choice: "none", method: null })}
          className={chip}
        >
          A pagar
        </button>
        <button
          type="button"
          aria-pressed={v.choice === "deposit"}
          onClick={() => set({ ...v, choice: "deposit" })}
          className={chip}
        >
          Sinal
        </button>
        <button
          type="button"
          aria-pressed={v.choice === "full"}
          onClick={() => set({ ...v, choice: "full" })}
          className={chip}
        >
          <Icon name="checkCircle" size={18} />
          Já pagou
        </button>
      </div>
      {form && v.choice === "deposit" ? (
        <div className="flex gap-2" role="group" aria-label="Sinal">
          <button type="button" aria-pressed={asking} onClick={() => set({ ...v, request: true })} className={chip}>
            Pedir à cliente
          </button>
          <button
            type="button"
            aria-pressed={!asking}
            onClick={() => set({ ...v, request: false })}
            className={chip}
          >
            Já recebi
          </button>
        </div>
      ) : null}
      {v.choice === "deposit" ? (
        <div className="grid gap-1">
          <label className="flex items-center gap-3">
            <span className="text-sm font-bold">Valor do sinal</span>
            <span className="relative ml-auto w-36">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted">
                R$
              </span>
              <input
                inputMode="decimal"
                autoComplete="off"
                aria-label="Valor do sinal"
                aria-invalid={bad}
                value={amount}
                onChange={(e) => set({ ...v, amount: e.target.value })}
                className={`min-h-12 w-full rounded-full border bg-surface pl-11 pr-4 text-right text-base font-bold tabular-nums ${
                  bad ? "border-fail" : "border-line"
                }`}
              />
            </span>
          </label>
          {bad ? (
            <p role="alert" className="text-sm font-semibold text-fail">
              Digite o valor do sinal, menor que o total (ex.: 30,00).
            </p>
          ) : asking ? (
            <p className="text-sm font-semibold text-muted">
              Vai no WhatsApp com a sua chave Pix. Fica <b className="text-wait">a receber</b> até você marcar
              &quot;Sinal recebido&quot;.
            </p>
          ) : rest !== null ? (
            <p className="text-sm font-semibold text-muted">
              Falta <b className="text-fg">{formatBRL(rest)}</b> para pagar no dia.
            </p>
          ) : null}
        </div>
      ) : null}
      {v.choice !== "none" && !asking ? (
        <div className="grid gap-1">
          <p className="text-xs font-bold text-muted">Forma (opcional)</p>
          <div className="flex gap-2" role="group" aria-label="Forma de pagamento">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={v.method === m}
                // tocar de novo tira a escolha
                onClick={() => set({ ...v, method: v.method === m ? null : m })}
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
