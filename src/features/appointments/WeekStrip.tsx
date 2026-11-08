"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addDays, formatDayTitle, formatMonthYear } from "@/lib/dates";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
/** Arraste de lado maior que isso troca de semana. */
const SWIPE_PX = 50;

export type WeekDay = { date: string; has: boolean; closed: boolean };

const href = (day: string, today: string) => (day === today ? "/agenda" : `/agenda?d=${day}`);

/** Domingo a sábado do dia escolhido. Arrastar para o lado vai para a mesma data da semana vizinha. */
export function WeekStrip({ date, today, days, summary }: { date: string; today: string; days: WeekDay[]; summary: string }) {
  const router = useRouter();
  // Seleção otimista: o dia acende no toque, sem esperar o servidor
  const [sel, setSel] = useState(date);
  const [prevDate, setPrevDate] = useState(date);
  if (prevDate !== date) {
    setPrevDate(date);
    setSel(date);
  }
  const x0 = useRef<number | null>(null);
  const swiped = useRef(false);

  return (
    <div className="mb-3">
      <div className="mb-1 flex min-h-11 items-center justify-between gap-3 px-1">
        <p className="text-[15px] font-bold">{formatMonthYear(days[3].date).replace(/ de \d+$/, "")}</p>
        <Link
          href="/agenda"
          scroll={false}
          onClick={() => setSel(today)}
          className="btn-glass min-h-9 rounded-full px-4 text-[13px] font-bold leading-9 text-primary-text"
        >
          Hoje
        </Link>
      </div>
      <nav
        aria-label="Dias da semana"
        className="wk-days glass"
        onPointerDown={(e) => {
          x0.current = e.clientX;
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          if (x0.current === null) return;
          const dx = e.clientX - x0.current;
          x0.current = null;
          if (Math.abs(dx) < SWIPE_PX) return;
          swiped.current = true;
          const next = addDays(sel, dx < 0 ? 7 : -7);
          setSel(next);
          router.push(href(next, today), { scroll: false });
        }}
        // Depois de arrastar, o clique que o navegador solta no fim não abre o dia
        onClickCapture={(e) => {
          if (swiped.current) e.preventDefault();
          swiped.current = false;
        }}
      >
        {days.map((d) => {
          const isToday = d.date === today;
          return (
            <Link
              key={d.date}
              href={href(d.date, today)}
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
      </nav>
      <p className="pt-1.5 text-center text-xs font-bold text-muted" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
