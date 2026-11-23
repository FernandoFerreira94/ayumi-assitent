"use client";

import { useState } from "react";
import { fmtMonthLong, fmtMonthShort } from "./format";

const num = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

/** Teto "redondo" do eixo: 1, 2 ou 5 × 10^n acima do maior valor (mínimo 5, para poucos dados não virarem barras cheias). */
function niceMax(v: number): number {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/**
 * Contagem por mês (12 meses), no mesmo visual do gráfico de MRR: uma série na cor da marca, dica no hover/foco
 * e tabela escondida para leitor de tela. `label` nomeia o valor ("Agendamentos", "Salões novos").
 */
export function MonthBars({ points, label }: { points: { month: string; value: number }[]; label: string }) {
  const [on, setOn] = useState<number | null>(null);
  const top = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const sel = on === null ? null : points[on];
  const cols = { gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` };

  return (
    <figure className="grid gap-3">
      <figcaption className="sr-only">{label} por mês, últimos {points.length} meses</figcaption>
      <div className="relative" aria-hidden="true">
        <div className="relative grid h-44 items-end gap-1 border-b border-line pl-10 sm:gap-2" style={cols}>
          <div className="pointer-events-none absolute inset-y-0 left-10 right-0 grid grid-rows-2">
            {[top, top / 2].map((t) => (
              <div key={t} className="relative border-t border-line">
                <span className="absolute -left-10 -top-2 w-8 text-right text-[11px] font-semibold text-muted tabular-nums">
                  {num(t)}
                </span>
              </div>
            ))}
            <span className="absolute -bottom-2 -left-10 w-8 text-right text-[11px] font-semibold text-muted">0</span>
          </div>
          {points.map((p, i) => (
            <button
              key={p.month}
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
                className={`w-full max-w-5 rounded-t-[4px] transition-colors ${on === null || on === i ? "bg-primary" : "bg-primary/35"}`}
                style={{ height: `${Math.max(p.value ? 1.5 : 0, (p.value / top) * 100)}%` }}
              />
            </button>
          ))}
        </div>
        <div className="grid gap-1 pl-10 pt-1.5 sm:gap-2" style={cols}>
          {points.map((p, i) => (
            <span
              key={p.month}
              className={`text-center text-[11px] font-semibold ${i === points.length - 1 ? "text-fg" : "text-muted"} ${
                (points.length - 1 - i) % 2 ? "max-sm:invisible" : ""
              }`}
            >
              {fmtMonthShort(p.month)}
            </span>
          ))}
        </div>
        {sel ? (
          <div
            className="pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 rounded-2xl border border-line bg-surface p-3 text-xs shadow-[var(--shadow)]"
            style={{ left: `calc(2.5rem + (100% - 2.5rem) * ${(on! + 0.5) / points.length})` }}
          >
            <p className="font-bold">{fmtMonthLong(sel.month)}</p>
            <p className="font-brand text-base tabular-nums">{num(sel.value)}</p>
            <p className="font-semibold text-muted">{label}</p>
          </div>
        ) : null}
      </div>
      {/* sr-only direto na <table> não encolhe e alarga a página no celular */}
      <div className="sr-only">
        <table>
          <caption>{label} por mês</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">{label}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month}>
                <th scope="row">{fmtMonthLong(p.month)}</th>
                <td>{num(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
