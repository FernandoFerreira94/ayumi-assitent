"use client";

import Link from "next/link";
import { useState } from "react";
import { formatBRL } from "@/lib/dates";
import type { MonthPoint } from "./insights";

// Mesmas famílias do ServicePie (ganhos x gastos); validadas no tema claro (scripts do dataviz).
const INCOME = "#6250d6";
const EXPENSE = "#b3402f";
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const short = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1];

const W = 560;
const H = 200;
const PAD_B = 26;
const PAD_T = 8;
const BAR = 18;

/** Topo arredondado 4px, base reta no zero. */
function bar(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

/**
 * Últimos meses: recebido x gastos, barras lado a lado (um eixo só, em reais).
 * Passar o mouse mostra os valores do mês; clicar abre o mês. Os valores também ficam na tabela (leitor de tela).
 */
export function MonthlyBars({ points, current }: { points: MonthPoint[]; current: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.flatMap((p) => [p.received, p.spent]));
  const slot = W / points.length;
  const plot = H - PAD_B - PAD_T;
  const y = (v: number) => PAD_T + plot - (v / max) * plot;
  const hp = hover === null ? null : points[hover];

  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-4 text-xs font-bold text-muted" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-sm" style={{ background: INCOME }} /> Recebido
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-sm" style={{ background: EXPENSE }} /> Gastos
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Recebido e gastos dos últimos meses"
        onMouseLeave={() => setHover(null)}
      >
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="var(--line)" strokeDasharray="3 4" />
        ))}
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--line)" />
        {points.map((p, i) => {
          const cx = slot * i + slot / 2;
          const on = hover === i;
          const dim = hover !== null && !on;
          return (
            <Link key={p.ym} href={`/financeiro?m=${p.ym}`} scroll={false} aria-label={`Abrir ${short(p.ym)}`}>
              <g
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                style={{ opacity: dim ? 0.45 : 1, transition: "opacity .15s" }}
              >
                {/* área de clique maior que as barras */}
                <rect x={slot * i} y={0} width={slot} height={H} fill={on ? "var(--soft)" : "transparent"} rx={10} />
                <path d={bar(cx - BAR - 1, y(p.received), BAR, y(0) - y(p.received))} fill={INCOME} />
                <path d={bar(cx + 1, y(p.spent), BAR, y(0) - y(p.spent))} fill={EXPENSE} />
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  className="text-[12px] font-bold"
                  fill={p.ym === current ? "var(--primary-text)" : "var(--muted)"}
                >
                  {short(p.ym)}
                </text>
              </g>
            </Link>
          );
        })}
      </svg>
      {hp ? (
        <div
          role="status"
          className="pointer-events-none absolute top-6 z-10 min-w-40 -translate-x-1/2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold shadow-lg ring-1 ring-line"
          style={{ left: `${Math.min(85, Math.max(15, ((hover! + 0.5) / points.length) * 100))}%` }}
        >
          <p className="pb-1 font-bold capitalize">{short(hp.ym)}</p>
          <p className="flex justify-between gap-3">
            Recebido <b className="tabular-nums">{formatBRL(hp.received)}</b>
          </p>
          <p className="flex justify-between gap-3">
            Gastos <b className="tabular-nums">{formatBRL(hp.spent)}</b>
          </p>
          <p className="flex justify-between gap-3 border-t border-line pt-1">
            Saldo <b className="tabular-nums">{formatBRL(hp.received - hp.spent)}</b>
          </p>
        </div>
      ) : null}
      <table className="sr-only">
        <caption>Recebido e gastos por mês</caption>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Recebido</th>
            <th>Gastos</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.ym}>
              <td>{short(p.ym)}</td>
              <td>{formatBRL(p.received)}</td>
              <td>{formatBRL(p.spent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
