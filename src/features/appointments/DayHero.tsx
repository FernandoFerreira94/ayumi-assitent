"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { Icon } from "@/components/ui/Icon";
import { setValuesHidden, useValuesHidden } from "@/features/finance/hide-values";
import { formatBRL } from "@/lib/dates";
import type { Briefing } from "./briefing";

/** Balão na tela antes de sumir sozinho. */
const SHOW_MS = 6000;
/** Intervalo sem balão até a próxima fala. */
const GAP_MS = 9000;
/** A primeira fala espera a tela assentar. */
const FIRST_MS = 700;

const MASKED = "R$ •••••";

/**
 * Topo do Painel: a Bolha (maior) com a fala do dia num balão que aparece e some sozinho, alternando as
 * informações, e à direita os ganhos do dia (recebido x o que falta) com olhinho para esconder os valores.
 * Tocar na Bolha mostra a próxima fala; tocar no balão fecha.
 */
export function DayHero({
  briefing,
  isToday,
  receivedCents,
  forecastCents,
}: {
  briefing: Briefing;
  isToday: boolean;
  receivedCents: number;
  forecastCents: number;
}) {
  const lines = briefing.lines;
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [hop, setHop] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Ciclo: aparece, fica SHOW_MS, some, espera GAP_MS e volta com a próxima fala
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        if (shown) setShown(false);
        else {
          setI((n) => n + 1);
          setShown(true);
        }
      },
      shown ? SHOW_MS : i === 0 ? FIRST_MS : GAP_MS,
    );
    return () => clearTimeout(timer.current);
  }, [shown, i]);

  // i começa em 1 na primeira fala: o resumo do dia
  const line = lines[(Math.max(i, 1) - 1) % lines.length];
  const mood = (Math.max(i, 1) - 1) % lines.length === 0 ? briefing.mood : "happy";

  return (
    <div className="relative mb-3 flex items-center gap-3">
      <button
        type="button"
        data-tour="bubble"
        aria-label={shown ? "Ver a próxima fala da Bolha" : "Ouvir a Bolha"}
        onClick={() => {
          setHop((n) => n + 1);
          setI((n) => n + 1);
          setShown(true);
        }}
        className="grid size-21 shrink-0 place-items-center rounded-full"
      >
        {/* key muda a cada toque: remonta e a animação de pulo roda de novo */}
        <span key={hop} className={hop ? "mascot-hop" : "mascot-float"}>
          <Mascot size={80} mood={shown ? mood : briefing.mood} idle />
        </span>
      </button>

      <DayEarnings isToday={isToday} receivedCents={receivedCents} forecastCents={forecastCents} />

      {/* Balão por cima dos ganhos, saindo da Bolha; some sozinho ou ao toque */}
      <div aria-live="polite" className="pointer-events-none absolute inset-y-0 left-[92px] right-0 flex items-center">
        {shown ? (
          <button
            key={i}
            type="button"
            onClick={() => setShown(false)}
            aria-label={`${line} Toque para fechar.`}
            className="speech speech-solid speech-pop pointer-events-auto relative w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold leading-snug"
          >
            {line}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Rosca do dia: recebido (concluídos) sobre o previsto; o resto é o que falta receber. */
function DayEarnings({
  isToday,
  receivedCents,
  forecastCents,
}: {
  isToday: boolean;
  receivedCents: number;
  forecastCents: number;
}) {
  const hidden = useValuesHidden();
  const masked = hidden !== false;
  const missing = Math.max(forecastCents - receivedCents, 0);
  const pct = forecastCents > 0 ? Math.min(receivedCents / forecastCents, 1) : 0;
  const R = 22;
  const C = 2 * Math.PI * R;
  const money = (c: number) => (masked ? MASKED : formatBRL(c));

  return (
    <section
      data-tour="money"
      aria-label={isToday ? "Ganhos de hoje" : "Ganhos do dia"}
      className="glass flex min-h-21 min-w-0 flex-1 items-center gap-3 rounded-3xl py-2.5 pl-3 pr-1"
    >
      <div className="relative grid size-14 shrink-0 place-items-center">
        <svg viewBox="0 0 56 56" className="size-14 -rotate-90" aria-hidden="true">
          <circle cx="28" cy="28" r={R} fill="none" stroke="var(--soft)" strokeWidth="7" />
          {pct > 0 ? (
            <circle
              cx="28"
              cy="28"
              r={R}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${C * pct} ${C}`}
              className="earn-arc"
            />
          ) : null}
        </svg>
        <span className="absolute text-[11px] font-bold tabular-nums text-primary-text">
          {forecastCents > 0 ? `${Math.round(pct * 100)}%` : "–"}
        </span>
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {isToday ? "Recebido hoje" : "Recebido no dia"}
        </p>
        <p className="truncate text-lg font-bold tabular-nums" data-money>
          {money(receivedCents)}
        </p>
        {forecastCents === 0 ? (
          <p className="truncate text-xs font-semibold text-muted">Nada previsto ainda</p>
        ) : (
          <>
            <p className="truncate text-xs font-semibold tabular-nums text-muted">Falta {money(missing)}</p>
            <p className="truncate text-xs font-semibold tabular-nums text-muted">Previsto {money(forecastCents)}</p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => setValuesHidden(!masked)}
        aria-pressed={masked}
        aria-label={masked ? "Mostrar valores" : "Esconder valores"}
        className="grid size-11 shrink-0 place-items-center self-start rounded-full text-muted"
      >
        <Icon name={masked ? "eyeOff" : "eye"} size={20} />
      </button>
    </section>
  );
}
