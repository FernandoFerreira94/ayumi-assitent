"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Icon } from "@/components/ui/Icon";
import type { PaymentMethod, PaymentRow, PaymentStatus } from "../types";
import { fmtDate, formatBRL, METHOD_LABEL, PAY_STATUS } from "./format";
import { PaymentBadge } from "./StatusBadge";
import { adminFigure } from "./styles";

const MethodIcon = ({ m }: { m: PaymentMethod }) => (
  <Icon name={m === "pix" ? "coins" : "wallet"} size={16} className="text-muted" />
);

const select =
  "min-h-11 w-full rounded-2xl border-[1.5px] border-line bg-surface px-3 text-base font-semibold focus:border-primary focus:outline-none";

/** Pagamentos do mês com filtro de situação e forma. Tabela no desktop, cartões no celular. */
export function PaymentsView({ payments }: { payments: PaymentRow[] }) {
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const list = useMemo(
    () => payments.filter((p) => (!status || p.status === status) && (!method || p.method === method)),
    [payments, status, method],
  );

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <label>
          <span className="sr-only">Situação</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus | "")} className={select}>
            <option value="">Todas as situações</option>
            {(Object.keys(PAY_STATUS) as PaymentStatus[]).map((s) => (
              <option key={s} value={s}>
                {PAY_STATUS[s].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Forma de pagamento</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | "")} className={select}>
            <option value="">Cartão e Pix</option>
            <option value="card">Cartão</option>
            <option value="pix">Pix</option>
          </select>
        </label>
      </div>

      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? "pagamento" : "pagamentos"}
      </p>

      {!list.length ? (
        <EmptyState icon="wallet" title="Nenhum pagamento" description="Neste mês, com estes filtros, não há pagamentos." />
      ) : (
        <>
          <ul className="grid gap-2 lg:hidden">
            {list.map((p) => (
              <li key={p.paymentId} className="grid gap-1 rounded-2xl border border-line bg-surface p-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold">{p.salonName}</span>
                  <PaymentBadge status={p.status} />
                </span>
                <span className="flex items-center justify-between gap-2 text-sm font-semibold text-muted">
                  <span className="flex items-center gap-1.5">
                    <MethodIcon m={p.method} />
                    {fmtDate(p.paidAt ?? p.createdAt)} · {METHOD_LABEL[p.method]}
                  </span>
                  <span className={`${adminFigure} text-lg text-fg`}>{formatBRL(p.amountCents)}</span>
                </span>
                {p.feeCents !== null ? (
                  <span className="text-xs font-semibold text-muted tabular-nums">
                    Taxa {formatBRL(p.feeCents)} · líquido <strong className="text-ok">{formatBRL(p.netCents ?? 0)}</strong>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-3xl border border-line bg-surface lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-bg text-xs font-bold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Data</th>
                  <th scope="col" className="px-4 py-3">Salão</th>
                  <th scope="col" className="px-4 py-3">Forma</th>
                  <th scope="col" className="px-4 py-3">Situação</th>
                  <th scope="col" className="px-4 py-3 text-right">Valor</th>
                  <th scope="col" className="px-4 py-3 text-right">Taxa</th>
                  <th scope="col" className="px-4 py-3 text-right">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.paymentId} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold tabular-nums">{fmtDate(p.paidAt ?? p.createdAt)}</td>
                    <td className="px-4 py-3 font-bold">{p.salonName}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <MethodIcon m={p.method} />
                        {METHOD_LABEL[p.method]}
                      </span>
                    </td>
                    <td className="px-4 py-3"><PaymentBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{formatBRL(p.amountCents)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-muted tabular-nums">
                      {p.feeCents === null ? "—" : formatBRL(p.feeCents)}
                    </td>
                    <td className={`px-4 py-3 text-right text-base ${adminFigure} ${p.netCents === null ? "text-muted" : "text-ok"}`}>
                      {p.netCents === null ? "—" : formatBRL(p.netCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
