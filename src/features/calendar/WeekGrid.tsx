"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { notify } from "@/components/feedback/toast";
import { rescheduleAppointment } from "@/features/appointments/actions";
import { canDrag, conflictReason, layoutColumns, type Occupant } from "@/features/appointments/agenda-grid";
import { warnSync } from "@/features/appointments/sync-warning";
import { hhmm, type Span } from "@/features/appointments/timeline";
import { addDays } from "@/lib/dates";
import { DESKTOP_QUERY } from "@/lib/use-media";
import { CalendarBar } from "./CalendarBar";
import { MONTH_NAMES } from "./grid";
import { ViewSwitch } from "./ViewSwitch";
import { weekDrop } from "./week";

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
/** Largura da coluna das horas, à esquerda dos 7 dias. */
const HOURS_COL = 56;
/** Mexer mais que isso com o botão apertado já é arraste (no desktop não precisa segurar). */
const TOLERANCE_PX = 5;

/** Onde um atendimento está: coluna do dia (0 = domingo) e horário. */
type Place = { col: number; span: Span };
type Drag = { id: string; from: Place; to: Place; bad: string | null };
type Gesture = Drag & { x0: number; y0: number; pid: number; active: boolean };

/** Os dias com os atendimentos trocados de lugar (arraste em curso ou salvo esperando o servidor). */
function relocate(days: WeekDay[], moves: Record<string, Place>): WeekDay[] {
  if (Object.keys(moves).length === 0) return days;
  const all = days.flatMap((d, col) =>
    d.items.map((it) => (moves[it.id] ? { it: { ...it, ...moves[it.id].span }, col: moves[it.id].col } : { it, col })),
  );
  return days.map((d, col) => ({ ...d, items: all.filter((x) => x.col === col).map((x) => x.it) }));
}

function occupantsOf(day: WeekDay): Occupant[] {
  return [
    ...day.items.map((it) => ({ id: it.id, kind: it.kind, label: it.label, start: it.start, end: it.end })),
    ...(day.pause ? [{ id: "pausa", kind: "block" as const, label: "Pausa", ...day.pause }] : []),
  ];
}

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
 * como na linha do dia (mesma divisão em colunas quando se sobrepõem). Arrastar um atendimento
 * troca o dia (coluna) e o horário (altura) de 15 em 15; clicar sem arrastar abre a linha do dia.
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

  // Lugar otimista depois de soltar, até o servidor mandar a semana nova
  const [moved, setMoved] = useState<Record<string, Place>>({});
  const [prevDays, setPrevDays] = useState(days);
  if (prevDays !== days) {
    setPrevDays(days);
    setMoved({});
  }
  const [drag, setDrag] = useState<Drag | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClickUntil = useRef(0);
  const base = relocate(days, moved);

  async function save(id: string, to: Place, from: Place, isUndo = false) {
    setMoved((m) => ({ ...m, [id]: to }));
    const name = days.flatMap((d) => d.items).find((it) => it.id === id)?.label ?? "";
    const date = days[to.col].date;
    const res = await rescheduleAppointment(id, date, hhmm(to.span.start), to.span.end - to.span.start).catch(
      () => null,
    );
    if (!res || !res.ok) {
      setMoved((m) => ({ ...m, [id]: from }));
      notify.error(res ? res.code : "NETWORK");
      return;
    }
    warnSync(res.data.sync);
    const when = `${WEEKDAY_NAMES[to.col].toLowerCase()} ${dayNum(date)}, ${hhmm(to.span.start)}`;
    if (isUndo) return notify.success(`${name} voltou para ${when}`);
    notify.undoable(
      `${name} foi para ${when}`,
      () => void save(id, from, to, true),
      "Lembrete do WhatsApp reprogramado",
    );
  }

  // O que os ouvintes da janela precisam ler da renderização mais recente
  const live = useRef({ base, win, save });
  useEffect(() => {
    live.current = { base, win, save };
  });

  // Ouvintes na janela: o ponteiro sai do bloco (e da coluna) durante o arraste
  useEffect(() => {
    const move = (e: globalThis.PointerEvent) => {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pid) return;
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;
      if (!g.active && Math.abs(dx) <= TOLERANCE_PX && Math.abs(dy) <= TOLERANCE_PX) return;
      g.active = true;
      e.preventDefault();
      const { base, win } = live.current;
      const colWidth = ((gridRef.current?.clientWidth ?? HOURS_COL + 700) - HOURS_COL) / 7;
      const to = weekDrop({ fromCol: g.from.col, from: g.from.span, dx, dy, colWidth, pxPerMin: PPM, win });
      g.to = to;
      // Dia fechado não impede (regra de 13/11): só choque com atendimento, bloqueio ou pausa
      g.bad = conflictReason({ id: g.id, ...to.span }, occupantsOf(base[to.col]));
      setDrag({ id: g.id, from: g.from, to, bad: g.bad });
    };
    const up = (e: globalThis.PointerEvent) => {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pid) return;
      gesture.current = null;
      if (!g.active) return; // clique sem arrastar: o onClick abre o dia
      suppressClickUntil.current = Date.now() + 400;
      setDrag(null);
      if (e.type === "pointercancel") return;
      if (g.bad) return notify.problem("Não deu para mudar", `${g.bad}. Voltou para o horário de antes.`);
      if (g.to.col === g.from.col && g.to.span.start === g.from.span.start) return;
      void live.current.save(g.id, g.to, g.from);
    };
    // Esc solta sem mudar nada
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || !gesture.current?.active) return;
      gesture.current = null;
      suppressClickUntil.current = Date.now() + 400;
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", key);
    };
  }, []);

  function press(e: PointerEvent<HTMLButtonElement>, col: number, it: WeekItem) {
    if (e.button !== 0 || gesture.current || it.kind !== "appointment" || !canDrag(it.status)) return;
    const from = { col, span: { start: it.start, end: it.end } };
    gesture.current = {
      id: it.id,
      from,
      to: from,
      bad: null,
      x0: e.clientX,
      y0: e.clientY,
      pid: e.pointerId,
      active: false,
    };
  }

  const shown = drag ? relocate(base, { [drag.id]: drag.to }) : base;
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

      <div
        ref={gridRef}
        className={`grid grid-cols-[56px_repeat(7,minmax(0,1fr))] ${drag ? "cursor-grabbing select-none" : ""}`}
      >
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

        {shown.map((d, col) => (
          <DayColumn
            key={d.date}
            day={d}
            hours={hours}
            y={y}
            height={height}
            nowMin={d.date === today ? nowMin : null}
            drag={drag}
            ghost={drag && drag.from.col === col ? drag.from.span : null}
            onPress={(e, it) => press(e, col, it)}
            onOpen={() => {
              if (Date.now() < suppressClickUntil.current) return;
              router.push(`/calendario?d=${d.date}`, { scroll: false });
            }}
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
  drag,
  ghost,
  onPress,
  onOpen,
}: {
  day: WeekDay;
  hours: number[];
  y: (m: number) => number;
  height: number;
  nowMin: number | null;
  drag: Drag | null;
  /** Onde o atendimento arrastado estava, marcado na coluna de origem. */
  ghost: Span | null;
  onPress: (e: PointerEvent<HTMLButtonElement>, it: WeekItem) => void;
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
        <div
          className="ag-ev pause fixed-pause"
          style={place(day.pause, "pausa")}
          role="img"
          aria-label={`Pausa, ${range(day.pause)}`}
        />
      ) : null}
      {ghost ? <div className="ag-ghost" style={place(ghost, "ghost")} /> : null}
      {day.items.map((it) => {
        const lifted = drag?.id === it.id;
        const movable = it.kind === "appointment" && canDrag(it.status);
        const cls = [
          "ag-ev",
          it.kind === "block" ? `pause ${it.external ? "ext" : ""}` : "",
          it.end - it.start < 45 ? "tight" : "",
          lifted ? "lift" : "",
          lifted && drag?.bad ? "bad" : "",
        ].join(" ");
        return (
          <button
            key={it.id}
            type="button"
            onPointerDown={(e) => onPress(e, it)}
            onClick={onOpen}
            className={cls}
            style={place(it, it.id)}
            data-color={it.color}
            data-status={it.status}
            data-drag={movable ? "" : undefined}
            aria-label={`${it.label}${it.sub ? `, ${it.sub}` : ""}, ${range(it)}${movable ? ". Arraste para outro dia ou horário." : ""}`}
          >
            <b className="truncate">{it.label}</b>
            {it.end - it.start >= 45 ? <span className="tm truncate">{hhmm(it.start)}</span> : null}
          </button>
        );
      })}
      {nowMin !== null && nowMin >= 0 ? (
        <div className="ag-now" style={{ top: y(nowMin), left: 0 }} aria-hidden="true" />
      ) : null}
    </div>
  );
}
