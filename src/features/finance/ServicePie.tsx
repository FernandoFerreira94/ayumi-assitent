"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/dates";
import type { Slice } from "./summary";

// Paleta categórica validada (scripts/validate_palette.js do dataviz): passa CVD e separação no tema claro.
// Rosa e verde-água ficam abaixo de 3:1 no fundo, por isso todo valor também aparece escrito na lista.
const SLOTS = ["#6250d6", "#e87ba4", "#2a78d6", "#1baf7a", "#eb6834"];
const OTHER = "#898781";
const colorOf = (s: Slice, i: number) => (s.name === "Outros" ? OTHER : (SLOTS[i] ?? OTHER));

const R = 80;
const r = 54;
const pct = (part: number, total: number) => `${Math.round((part / total) * 100)}%`;

function arc(a0: number, a1: number) {
  const p = (rad: number, a: number) => `${100 + rad * Math.sin(a)} ${100 - rad * Math.cos(a)}`;
  const big = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(R, a0)}A${R} ${R} 0 ${big} 1 ${p(R, a1)}L${p(r, a1)}A${r} ${r} 0 ${big} 0 ${p(r, a0)}Z`;
}

/**
 * Divisão do total por fatia (serviço ou categoria de gasto). Com menos de 3 fatias a pizza não diz nada que a lista não diga,
 * então só a lista aparece. Tocar numa fatia ou linha mostra o valor dela no centro.
 */
export function ServicePie({ slices, total, label }: { slices: Slice[]; total: number; label: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const pick = (i: number) => setSel((s) => (s === i ? null : i));
  // Ângulo final de cada fatia = soma acumulada das fatias até ela
  const ends = slices.map((_, i) => (slices.slice(0, i + 1).reduce((t, x) => t + x.cents, 0) / total) * Math.PI * 2);
  const arcs = ends.map((a1, i) => ({ a0: i ? ends[i - 1] : 0, a1 }));
  const focus = sel === null ? null : slices[sel];

  return (
    <div className="grid gap-4">
      {slices.length >= 3 ? (
        <svg viewBox="0 0 200 200" className="mx-auto w-52" role="img" aria-label={`Divisão de ${label}`}>
          {slices.map((s, i) => (
            <path
              key={s.name}
              d={arc(arcs[i].a0, arcs[i].a1)}
              fill={colorOf(s, i)}
              stroke="var(--surface)"
              strokeWidth="2"
              strokeLinejoin="round"
              opacity={sel === null || sel === i ? 1 : 0.35}
              onClick={() => pick(i)}
              className="cursor-pointer transition-opacity"
            />
          ))}
          <text x="100" y="96" textAnchor="middle" className="fill-fg text-[22px] font-bold">
            {focus ? pct(focus.cents, total) : formatBRL(total).replace(",00", "")}
          </text>
          <text x="100" y="118" textAnchor="middle" className="fill-muted text-[11px] font-bold">
            {focus ? focus.name.slice(0, 18) : label}
          </text>
        </svg>
      ) : null}
      <ul className="grid gap-1">
        {slices.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              onClick={() => pick(i)}
              aria-pressed={sel === i}
              className={`flex min-h-11 w-full items-center gap-3 rounded-full px-3 text-left ${sel === i ? "bg-soft" : ""}`}
            >
              <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: colorOf(s, i) }} />
              <span className="flex-1 truncate font-bold">{s.name}</span>
              <span className="text-sm font-bold tabular-nums">{formatBRL(s.cents)}</span>
              <span className="w-10 text-right text-xs font-bold tabular-nums text-muted">{pct(s.cents, total)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
