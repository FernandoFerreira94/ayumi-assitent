"use client";

import { useState } from "react";
import type { MrrMonthRow } from "../types";
import { fmtMonthLong, fmtMonthShort, formatBRL } from "./format";

/** Teto "redondo" do eixo: 1, 2 ou 5 × 10^n acima do maior valor. */
function niceMax(v: number): number {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const compact = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);

/**
 * MRR dos últimos 12 meses: uma série só (cor da marca), barras finas com ponta arredondada, grade discreta.
 * Passar o mouse (ou focar com Tab) mostra o mês com novo e cancelado. A tabela escondida serve ao leitor de tela.
 */
export function MrrChart({ months }: { months: MrrMonthRow[] }) {
  const [on, setOn] = useState<number | null>(null);
  const top = niceMax(Math.max(...months.map((m) => m.mrrCents)));
  const ticks = [top, top / 2, 0];
  const sel = on === null ? null : months[on];

  return (
    <figure className="grid gap-3">
      <figcaption className="sr-only">MRR por mês, últimos 12 meses</figcaption>
      <div className="relative" aria-hidden="true">
        <div className="relative grid h-52 grid-cols-12 items-end gap-1 border-b border-line pl-14 sm:gap-2">
          <div className="pointer-events-none absolute inset-y-0 left-14 right-0 grid grid-rows-2">
            {ticks.slice(0, 2).map((t) => (
              <div key={t} className="relative border-t border-line">
                <span className="absolute -left-14 -top-2 w-12 text-right text-[11px] font-semibold text-muted tabular-nums">
                  {compact(t)}
                </span>
              </div>
            ))}
            <span className="absolute -bottom-2 -left-14 w-12 text-right text-[11px] font-semibold text-muted">R$ 0</span>
          </div>
          {months.map((m, i) => (
            <button
              key={m.month}
              type="button"
              tabIndex={-1}
              onMouseEnter={() => setOn(i)}
              onMouseLeave={() => setOn(null)}
              onFocus={() => setOn(i)}
              onBlur={() => setOn(null)}
              onClick={() => setOn(on === i ? null : i)}
              className="relative flex h-full items-end justify-center outline-none"
            >
              <span
                className={`w-full max-w-5 rounded-t-[4px] transition-colors ${
                  on === null || on === i ? "bg-primary" : "bg-primary/35"
                }`}
                style={{ height: `${Math.max(m.mrrCents ? 1.5 : 0, (m.mrrCents / top) * 100)}%` }}
              />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-1 pl-14 pt-1.5 sm:gap-2">
          {months.map((m, i) => (
            <span
              key={m.month}
              className={`text-center text-[11px] font-semibold ${i === months.length - 1 ? "text-fg" : "text-muted"} ${
                (months.length - 1 - i) % 2 ? "max-sm:invisible" : ""
              }`}
            >
              {fmtMonthShort(m.month)}
            </span>
          ))}
        </div>
        {sel ? (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-2xl border border-line bg-surface p-3 text-xs shadow-[var(--shadow)]"
            style={{ left: `calc(3.5rem + (100% - 3.5rem) * ${(on! + 0.5) / months.length})` }}
          >
            <p className="font-bold">{fmtMonthLong(sel.month)}</p>
            <p className="text-base font-bold tabular-nums">{formatBRL(sel.mrrCents)}</p>
            <p className="font-semibold text-muted tabular-nums">Novo {formatBRL(sel.newCents + sel.expansionCents)}</p>
            <p className="font-semibold text-muted tabular-nums">Perdido {formatBRL(sel.churnCents + sel.contractionCents)}</p>
          </div>
        ) : null}
      </div>
      {/* sr-only direto na <table> não encolhe (tabela ignora width: 1px) e alarga a página no celular */}
      <div className="sr-only">
      <table>
        <caption>MRR por mês</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">MRR</th>
            <th scope="col">Novo</th>
            <th scope="col">Cancelado</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{fmtMonthLong(m.month)}</th>
              <td>{formatBRL(m.mrrCents)}</td>
              <td>{formatBRL(m.newCents)}</td>
              <td>{formatBRL(m.churnCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}

/** Movimento do mês: de onde veio e para onde foi o MRR (texto em tinta, nunca na cor da série). */
export function MrrMovements({ month }: { month: MrrMonthRow }) {
  const items = [
    { label: "Novos", v: month.newCents, sign: "+" },
    { label: "Aumentos", v: month.expansionCents, sign: "+" },
    { label: "Reativados", v: month.reactivationCents, sign: "+" },
    { label: "Reduções", v: month.contractionCents, sign: "−" },
    { label: "Cancelados", v: month.churnCents, sign: "−" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-5">
      {items.map((i) => (
        <div key={i.label} className="grid">
          <dt className="font-semibold text-muted">{i.label}</dt>
          <dd className="font-bold tabular-nums">
            {i.v ? i.sign : ""}
            {formatBRL(i.v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
