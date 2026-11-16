"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { layoutColumns } from "@/features/appointments/agenda-grid";
import { hhmm, type Span } from "@/features/appointments/timeline";
import { addDays } from "@/lib/dates";
import { DESKTOP_QUERY } from "@/lib/use-media";
import { CalendarBar } from "./CalendarBar";
import { MONTH_NAMES } from "./grid";
import { ViewSwitch } from "./ViewSwitch";

export type WeekItem = Span & {
  id: string;
  kind: "appointment" | "block";
  label: string;
  sub?: string;
  color?: string;
  status?: string;
  external?: boolean;
};
export type WeekDay = { date: string; closed: boolean; pause: Span | null; items: WeekItem[] };

/** Mais baixa que a linha do dia (80 px/h): a semana inteira precisa caber sem rolar tanto. */
const HOUR_PX = 56;
const PPM = HOUR_PX / 60;
const GAP = 2;
const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const dayNum = (d: string) => Number(d.slice(8));
const monthName = (d: string) => MONTH_NAMES[Number(d.slice(5, 7)) - 1].toLowerCase();

/** "15 – 21 de novembro" ou "29 de novembro – 5 de dezembro". */
function weekTitle(first: string, last: string) {
  return first.slice(5, 7) === last.slice(5, 7)
    ? `${dayNum(first)} – ${dayNum(last)} de ${monthName(last)}`
    : `${dayNum(first)} de ${monthName(first)} – ${dayNum(last)} de ${monthName(last)}`;
}

/**
 * Semana do Calendário: coluna das horas e 7 dias lado a lado, com os blocos posicionados
 * como na linha do dia (mesma divisão em colunas quando se sobrepõem). Só leitura por enquanto:
 * tocar num atendimento ou no dia abre a linha do dia, onde se arrasta para remarcar.
 */
export function WeekGrid({
  days,
  win,
  today,
  nowMin,
}: {
  days: WeekDay[];
  win: Span;
  today: string;
  nowMin: number | null;
}) {
  const router = useRouter();
  const start = days[0].date;
  const week = (d: string) => `/calendario?v=semana&d=${d}`;

  // Abaixo de lg, 7 colunas ficam estreitas demais: cai para o dia (lido no efeito, depois da hidratação)
  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) router.replace(`/calendario?d=${start}`, { scroll: false });
  }, [router, start]);

  const y = (m: number) => (m - win.start) * PPM;
  const hours: number[] = [];
  for (let h = win.start; h <= win.end; h += 60) hours.push(h);
  const height = y(win.end);
  const inWeek = days.some((d) => d.date === today);

  return (
    <section aria-label={`Semana de ${weekTitle(start, days[6].date)}`} className="mb-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-extrabold">{weekTitle(start, days[6].date)}</h2>
        <div className="flex items-center gap-2">
          {inWeek ? null : (
            <Link
              href={week(today)}
              scroll={false}
              aria-keyshortcuts="T"
              className="btn-glass flex min-h-11 items-center rounded-full px-5 text-[15px] font-bold text-primary-text"
            >
              Hoje
            </Link>
          )}
          <ViewSwitch current="week" date={start} />
          <CalendarBar
            onPrev={() => router.push(week(addDays(start, -7)), { scroll: false })}
            onNext={() => router.push(week(addDays(start, 7)), { scroll: false })}
            prevLabel="Semana anterior"
            nextLabel="Próxima semana"
          />
        </div>
      </div>

      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        <span />
        {days.map((d, i) => {
          const isToday = d.date === today;
          return (
            <Link
              key={d.date}
              href={`/calendario?d=${d.date}`}
              scroll={false}
              aria-label={`Abrir ${WEEKDAY_NAMES[i]}, ${dayNum(d.date)} de ${monthName(d.date)}`}
              className="flex min-h-11 flex-col items-center justify-center rounded-2xl py-1 hover:bg-soft"
            >
              <span className="text-[12px] font-semibold text-muted">{WEEKDAY_NAMES[i]}</span>
              <span
                className={`grid size-8 place-content-center rounded-full text-[17px] font-extrabold tabular-nums ${
                  isToday ? "text-white" : ""
                }`}
                style={isToday ? { background: "var(--rose)" } : undefined}
              >
                {dayNum(d.date)}
              </span>
            </Link>
          );
        })}

        {/* Coluna das horas */}
        <div className="relative" style={{ height }} aria-hidden="true">
          {hours.map((h) => (
            <span
              key={h}
              className="absolute right-2 text-[12px] font-semibold tabular-nums text-muted"
              style={{ top: y(h) - 9 }}
            >
              {hhmm(h)}
            </span>
          ))}
        </div>

        {days.map((d) => (
          <DayColumn
            key={d.date}
            day={d}
            hours={hours}
            y={y}
            height={height}
            nowMin={d.date === today ? nowMin : null}
            onOpen={() => router.push(`/calendario?d=${d.date}`, { scroll: false })}
          />
        ))}
      </div>
    </section>
  );
}

function DayColumn({
  day,
  hours,
  y,
  height,
  nowMin,
  onOpen,
}: {
  day: WeekDay;
  hours: number[];
  y: (m: number) => number;
  height: number;
  nowMin: number | null;
  onOpen: () => void;
}) {
  const lay = layoutColumns(day.items);
  const place = (s: Span, id: string) => {
    const { col, cols } = lay.get(id) ?? { col: 0, cols: 1 };
    return {
      top: y(s.start),
      height: Math.max((s.end - s.start) * PPM - GAP, 16),
      left: `calc(100% * ${col} / ${cols} + ${GAP}px)`,
      width: `calc(100% / ${cols} - ${GAP * 2}px)`,
      padding: "3px 6px 3px 9px",
    };
  };
  const range = (s: Span) => `${hhmm(s.start)}–${hhmm(s.end)}`;

  return (
    <div className="relative border-l border-line" style={{ height }}>
      {hours.map((h) => (
        <div key={h} aria-hidden="true" className="absolute inset-x-0 border-t border-line" style={{ top: y(h) }} />
      ))}
      {day.closed ? <div className="ag-closed" style={{ inset: 0, borderRadius: 0 }} /> : null}
      {day.pause && !day.closed ? (
        <div className="ag-ev pause fixed-pause" style={place(day.pause, "pausa")} role="img" aria-label={`Pausa, ${range(day.pause)}`} />
      ) : null}
      {day.items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={onOpen}
          className={`ag-ev ${it.kind === "block" ? `pause ${it.external ? "ext" : ""}` : ""} ${it.end - it.start < 45 ? "tight" : ""}`}
          style={place(it, it.id)}
          data-color={it.color}
          data-status={it.status}
          aria-label={`${it.label}${it.sub ? `, ${it.sub}` : ""}, ${range(it)}`}
        >
          <b className="truncate">{it.label}</b>
          {it.end - it.start >= 45 ? <span className="tm truncate">{hhmm(it.start)}</span> : null}
        </button>
      ))}
      {nowMin !== null && nowMin >= 0 ? (
        <div className="ag-now" style={{ top: y(nowMin), left: 0 }} aria-hidden="true" />
      ) : null}
    </div>
  );
}
