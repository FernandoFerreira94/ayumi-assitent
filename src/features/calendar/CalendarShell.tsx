"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { isDateStr } from "@/lib/dates";
import { calendarYear } from "./actions";
import { CalendarBar, TodayFab } from "./CalendarBar";
import type { YearDays } from "./data";
import { parseView, shiftMonth, type CalendarView } from "./grid";
import { captureGhost, slideDay, zoom, type Ghost } from "./motion";
import { MonthGrid } from "./MonthView";
import { CalendarNavContext, type CalendarNav } from "./nav";
import { Pager, type PagerHandle } from "./Pager";
import { YearGrid } from "./YearView";

type YearState = { days?: YearDays; status: "ok" | "error"; stale?: boolean };
type Pending = { target: string; ghost: Ghost; anchor: DOMRect | null; anchorSel?: string; dir: "in" | "out" | "fade" };

const keyOf = (v: CalendarView) =>
  v.kind === "year" ? `y${v.year}` : v.kind === "month" ? `m${v.month}` : `d${v.date}`;
const hrefOf = (v: CalendarView) =>
  v.kind === "year"
    ? `/calendario?v=ano&y=${v.year}`
    : v.kind === "month"
      ? `/calendario?v=mes&m=${v.month}`
      : `/calendario?d=${v.date}`;

/**
 * O Calendário inteiro como um componente só: ano e mês são desenhados aqui, sem ida ao servidor,
 * com zoom contínuo entre as visões e deslizar para o lado. Só o dia (children) vem do servidor.
 * A URL acompanha (history), então recarregar, voltar e compartilhar continuam funcionando.
 */
export function CalendarShell({
  today,
  year,
  days,
  closedWeekdays,
  children,
}: {
  today: string;
  /** Ano que já veio do servidor junto com a página (o de hoje). */
  year: string;
  days: YearDays;
  closedWeekdays: number[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) ?? undefined;
  const urlView = parseView({ v: get("v"), y: get("y"), m: get("m"), d: get("d") }, today, isDateStr);
  const urlKey = keyOf(urlView);

  // Visão local: muda na hora no toque; a URL vai junto. Navegação de fora (dia, voltar) sincroniza aqui.
  const [view, setView] = useState<CalendarView>(urlView);
  const [seenUrl, setSeenUrl] = useState(urlKey);
  if (seenUrl !== urlKey) {
    setSeenUrl(urlKey);
    if (urlKey !== keyOf(view)) setView(urlView);
  }
  const key = keyOf(view);

  // ---- dados por ano (o atual vem do servidor; os outros sob demanda) ----
  const [fetched, setFetched] = useState<Record<string, YearState>>({});
  const [seenDays, setSeenDays] = useState(days);
  if (seenDays !== days) {
    // o servidor atualizou (agendou, remarcou...): os outros anos podem estar velhos
    setSeenDays(days);
    setFetched((f) => Object.fromEntries(Object.entries(f).map(([y, s]) => [y, { ...s, stale: true }])));
  }
  const daysOf = (y: string) => (y === year ? days : fetched[y]?.days);

  const retry = useRef<(y: string) => void>(() => {});
  const inflight = useRef(new Set<string>());
  const load = useCallback(async (y: string) => {
    if (inflight.current.has(y)) return;
    inflight.current.add(y);
    const res = await calendarYear(y).catch(() => null);
    inflight.current.delete(y);
    setFetched((f) => ({
      ...f,
      [y]: res?.ok ? { days: res.data, status: "ok" } : { days: f[y]?.days, status: "error" },
    }));
    if (!res?.ok) notify.error(res ? res.code : "NETWORK", () => retry.current(y));
  }, []);
  useEffect(() => {
    retry.current = (y) => void load(y);
  }, [load]);

  const needed = useMemo(() => {
    if (view.kind === "year") {
      const y = Number(view.year);
      return [String(y), String(y - 1), String(y + 1)];
    }
    const m = view.kind === "month" ? view.month : view.date.slice(0, 7);
    return [...new Set([m, shiftMonth(m, -1), shiftMonth(m, 1)].map((x) => x.slice(0, 4)))];
  }, [view]);

  useEffect(() => {
    for (const y of needed) {
      if (y === year) continue;
      const s = fetched[y];
      if (!s || s.stale) void load(y);
    }
  }, [needed, fetched, year, load]);

  const loadingYear = (y: string) => y !== year && !fetched[y]?.days && fetched[y]?.status !== "error";

  // ---- zoom entre visões ----
  const layer = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const pager = useRef<PagerHandle>(null);
  const pending = useRef<Pending | null>(null);
  const prevKey = useRef(key);

  const arm = (target: CalendarView, dir: Pending["dir"], anchorEl?: HTMLElement | null, anchorSel?: string) => {
    if (!layer.current) return;
    pending.current = {
      target: keyOf(target),
      ghost: captureGhost(layer.current),
      anchor: anchorEl?.getBoundingClientRect() ?? null,
      anchorSel,
      dir,
    };
  };

  useLayoutEffect(() => {
    const before = prevKey.current;
    prevKey.current = key;
    if (before === key) return;
    const p = pending.current;
    pending.current = null;
    const el = layer.current;
    if (!el || !host.current) return;
    if (p && p.target === key) {
      window.scrollTo(0, 0);
      let anchor = p.anchor;
      if (p.anchorSel) {
        const a = el.querySelector<HTMLElement>(`.cal-page:not([data-side]) [data-zoom="${p.anchorSel}"]`);
        if (a) {
          const r = a.getBoundingClientRect();
          // o mês de destino lá embaixo no ano: rola até ele antes de encolher
          if (r.bottom > window.innerHeight - 100) window.scrollBy(0, r.top - window.innerHeight / 2 + r.height / 2);
          anchor = a.getBoundingClientRect();
        }
      }
      zoom({ host: host.current, layer: el, ghost: p.ghost, anchor, dir: p.dir });
      return;
    }
    // dia -> dia (faixa da semana): o corpo do dia desliza do lado certo
    if (before.startsWith("d") && key.startsWith("d")) slideDay(el, key > before ? 1 : -1);
  }, [key]);

  const go = (v: CalendarView, mode: "push" | "replace") => {
    const url = hrefOf(v);
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
    setView(v);
  };

  const [dayPending, startDay] = useTransition();
  const [pendingDay, setPendingDay] = useState<string | null>(null);

  const openMonth = (month: string, el: HTMLElement) => {
    const v: CalendarView = { kind: "month", month };
    arm(v, "in", el);
    go(v, "push");
  };
  const toYear = (month: string) => {
    const v: CalendarView = { kind: "year", year: month.slice(0, 4) };
    arm(v, "out", null, `m${month}`);
    go(v, "push");
  };
  const openDay = (day: string, el: HTMLElement) => {
    if (dayPending) return;
    // o mês fica na tela (com a célula pulsando) até o dia chegar; aí a célula cresce até virar o dia
    arm({ kind: "day", date: day }, "in", el);
    setPendingDay(day);
    startDay(() => router.push(`/calendario?d=${day}`, { scroll: false }));
  };
  const nav = useMemo<CalendarNav>(
    () => ({
      toMonth: (month, fromDay) => {
        const v: CalendarView = { kind: "month", month };
        arm(v, "out", null, fromDay ? `d${fromDay}` : undefined);
        go(v, "push");
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toToday = () => {
    const tm = today.slice(0, 7);
    if (view.kind === "month") {
      if (shiftMonth(view.month, 1) === tm) return pager.current?.go(1);
      if (shiftMonth(view.month, -1) === tm) return pager.current?.go(-1);
      const v: CalendarView = { kind: "month", month: tm };
      arm(v, "fade");
      return go(v, "replace");
    }
    if (view.kind === "year") {
      const ty = Number(today.slice(0, 4));
      const y = Number(view.year);
      if (Math.abs(ty - y) === 1) return pager.current?.go(ty > y ? 1 : -1);
      const v: CalendarView = { kind: "year", year: String(ty) };
      arm(v, "fade");
      go(v, "replace");
    }
  };

  let content: React.ReactNode;
  if (view.kind === "day") {
    content = children;
  } else if (view.kind === "month") {
    const m = view.month;
    const grid = (month: string) => (
      <MonthGrid
        month={month}
        days={daysOf(month.slice(0, 4))}
        today={today}
        closedWeekdays={closedWeekdays}
        pendingDay={dayPending ? pendingDay : null}
        onDay={openDay}
      />
    );
    const pm = shiftMonth(m, -1);
    const nm = shiftMonth(m, 1);
    content = (
      <>
        <CalendarBar
          back={{ label: m.slice(0, 4), aria: `Voltar para o ano de ${m.slice(0, 4)}`, onClick: () => toYear(m) }}
          onPrev={() => pager.current?.go(-1)}
          onNext={() => pager.current?.go(1)}
          prevLabel="Mês anterior"
          nextLabel="Próximo mês"
          loading={loadingYear(m.slice(0, 4))}
        />
        <Pager
          ref={pager}
          label="Meses"
          prev={{ key: pm, node: grid(pm) }}
          cur={{ key: m, node: grid(m) }}
          next={{ key: nm, node: grid(nm) }}
          onPage={(dir) => go({ kind: "month", month: shiftMonth(m, dir) }, "replace")}
        />
        {today.startsWith(m) ? null : <TodayFab href="/calendario?v=mes" onClick={toToday} />}
      </>
    );
  } else {
    const y = Number(view.year);
    const grid = (yy: string) => <YearGrid year={yy} days={daysOf(yy)} today={today} onMonth={openMonth} />;
    content = (
      <>
        <CalendarBar
          onPrev={() => pager.current?.go(-1)}
          onNext={() => pager.current?.go(1)}
          prevLabel="Ano anterior"
          nextLabel="Próximo ano"
          loading={loadingYear(view.year)}
        />
        <Pager
          ref={pager}
          label="Anos"
          prev={{ key: String(y - 1), node: grid(String(y - 1)) }}
          cur={{ key: view.year, node: grid(view.year) }}
          next={{ key: String(y + 1), node: grid(String(y + 1)) }}
          onPage={(dir) => go({ kind: "year", year: String(y + dir) }, "replace")}
        />
        {today.startsWith(view.year) ? null : <TodayFab href="/calendario?v=ano" onClick={toToday} />}
      </>
    );
  }

  return (
    <CalendarNavContext value={nav}>
      <div ref={host} />
      <div ref={layer} className="cal-layer" data-view={view.kind}>
        {content}
      </div>
    </CalendarNavContext>
  );
}
