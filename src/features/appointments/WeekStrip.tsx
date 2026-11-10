"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { formatCalendarTitle, formatDayTitle, formatMonthYear } from "@/lib/dates";
import { useCalendarNav } from "@/features/calendar/nav";
import { MonthPicker } from "./MonthPicker";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
/** Tempo parado depois de rolar para considerar que a semana foi escolhida. */
const SETTLE_MS = 140;

export type WeekDay = { date: string; has: boolean; closed: boolean };

// No Calendário a URL sem ?d= abre o mês, então o dia (inclusive hoje) sempre leva ?d=
const href = (day: string, today: string, base: string, calendar: boolean) =>
  day === today && !calendar ? base : `${base}?d=${day}`;

/**
 * Semanas (domingo a sábado) em rolagem lateral contínua, com encaixe de uma semana por vez.
 * Ao parar numa semana, escolhe o mesmo dia da semana nela. Hoje/o dia escolhido já abre visível.
 */
export function WeekStrip({
  date,
  today,
  weeks,
  summary,
  base = "/calendario",
  calendar = false,
}: {
  date: string;
  today: string;
  /** Janela de semanas ao redor do dia escolhido; a rolagem vai além dela recentralizando. */
  weeks: WeekDay[][];
  summary: string;
  /** Página que recebe o dia escolhido (?d=): Painel ou Calendário. */
  base?: string;
  /** No Calendário: botão voltar para o mês e título do dia, como no iPhone. */
  calendar?: boolean;
}) {
  const router = useRouter();
  // Dentro do Calendário, voltar ao mês é zoom na mesma tela, sem ir ao servidor
  const nav = useCalendarNav();
  // Seleção otimista: o dia acende no toque, sem esperar o servidor
  const [sel, setSel] = useState(date);
  const [prevDate, setPrevDate] = useState(date);
  if (prevDate !== date) {
    setPrevDate(date);
    setSel(date);
  }
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const weekIdx = (d: string) => weeks.findIndex((w) => w.some((x) => x.date === d));

  // Posiciona na semana do dia escolhido antes de pintar (abertura e recentralização depois de rolar)
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) {
      const i = weekIdx(date);
      if (i >= 0) el.scrollLeft = i * el.clientWidth;
      el.dataset.ready = "1"; // direto no DOM: o React não gerencia este atributo
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, weeks]);

  const onScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = scroller.current;
      if (!el || !el.clientWidth) return;
      const page = Math.round(el.scrollLeft / el.clientWidth);
      const cur = weekIdx(sel);
      if (page === cur || !weeks[page]) return;
      const dow = weeks[cur >= 0 ? cur : 0].findIndex((x) => x.date === sel);
      const next = weeks[page][Math.max(dow, 0)].date;
      setSel(next);
      router.push(href(next, today, base, calendar), { scroll: false });
    }, SETTLE_MS);
  };

  return (
    <div className="mb-3">
      <div className="mb-1 flex min-h-11 items-center justify-between gap-3 px-1">
        {calendar ? (
          <Link
            href={`/calendario?v=mes&m=${date.slice(0, 7)}`}
            scroll={false}
            onClick={(e) => {
              if (!nav) return;
              e.preventDefault();
              nav.toMonth(date.slice(0, 7), date);
            }}
            aria-label={`Voltar para o mês de ${formatMonthYear(date)}`}
            className="btn-glass flex min-h-11 items-center gap-1 rounded-full pl-3 pr-4 text-[15px] font-bold text-primary-text"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
            {formatMonthYear(date).split(" de ")[0]}
          </Link>
        ) : (
          <MonthPicker date={date} today={today} base={base} />
        )}
        <Link
          href={calendar ? `${base}?d=${today}` : base}
          scroll={false}
          onClick={() => setSel(today)}
          className="btn-glass min-h-11 rounded-full px-4 text-[13px] font-bold leading-[44px] text-primary-text"
        >
          Hoje
        </Link>
      </div>
      <nav aria-label="Dias da semana" className="wk-days glass">
        <div ref={scroller} className="wk-scroll" onScroll={onScroll}>
          {weeks.map((week) => (
            <div key={week[0].date} className="wk-week">
              {week.map((d) => {
                const isToday = d.date === today;
                return (
                  <Link
                    key={d.date}
                    href={href(d.date, today, base, calendar)}
                    scroll={false}
                    draggable={false}
                    onClick={() => setSel(d.date)}
                    className="wk-d"
                    data-today={isToday || undefined}
                    data-has={d.has || undefined}
                    data-closed={d.closed || undefined}
                    aria-current={d.date === sel ? "date" : undefined}
                    aria-label={`${formatDayTitle(d.date)}${isToday ? " (hoje)" : ""}${d.closed ? ", salão fechado" : ""}`}
                  >
                    <small>{WEEKDAYS[new Date(`${d.date}T12:00:00`).getDay()]}</small>
                    <b>{Number(d.date.slice(8))}</b>
                    <i aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
      {calendar ? <h2 className="pt-3 text-center text-[15px] font-bold">{formatCalendarTitle(date)}</h2> : null}
      {/* O resumo do dia leva ao Financeiro; a pílula é pequena, mas o toque pega 44px de altura */}
      <p className="pt-1.5 text-center text-xs font-bold text-muted" aria-live="polite">
        <Link href="/financeiro" aria-label={`${summary}. Ver financeiro`} className="glass relative inline-flex min-h-8 items-center rounded-full px-3 py-1 text-fg before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']">
          {summary} ›
        </Link>
      </p>
    </div>
  );
}
