"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { addDays, formatDayTitle } from "@/lib/dates";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const BACK = 60;
const AHEAD = 120;

// A janela fica presa a "hoje": trocar de dia não remonta a lista, então a pílula desliza em vez de pular.
function windowFor(today: string, date: string): string[] {
  const inside = date >= addDays(today, -BACK) && date <= addDays(today, AHEAD);
  const anchor = inside ? today : date;
  return Array.from({ length: BACK + AHEAD + 1 }, (_, i) => addDays(anchor, i - BACK));
}

export function DayStrip({ date, today }: { date: string; today: string }) {
  // Seleção otimista: a pílula sai no toque, sem esperar o servidor renderizar o novo dia
  const [sel, setSel] = useState(date);
  const [prevDate, setPrevDate] = useState(date);
  if (prevDate !== date) {
    setPrevDate(date);
    setSel(date);
  }
  const days = windowFor(today, date);
  const index = Math.max(0, days.indexOf(sel));

  const ref = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    const strip = ref.current;
    const cell = strip?.querySelectorAll<HTMLElement>(".day")[index];
    if (!strip || !cell) return;
    strip.scrollTo({
      left: cell.offsetLeft - (strip.clientWidth - cell.offsetWidth) / 2,
      behavior: mounted.current ? "smooth" : "auto",
    });
    mounted.current = true;
  }, [index]);

  return (
    <nav ref={ref} aria-label="Dias" className="days glass mb-4" style={{ ["--i" as string]: index }}>
      <span className="ind" aria-hidden="true" />
      {days.map((day) => {
        const isToday = day === today;
        return (
          <Link
            key={day}
            href={isToday ? "/agenda" : `/agenda?d=${day}`}
            scroll={false}
            onClick={() => setSel(day)}
            className="day"
            data-today={isToday || undefined}
            aria-current={day === sel ? "date" : undefined}
            aria-label={`${formatDayTitle(day)}${isToday ? " (hoje)" : ""}`}
          >
            <small>{WEEKDAYS[new Date(`${day}T12:00:00`).getDay()]}</small>
            {Number(day.slice(8))}
            <span className="dot" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
