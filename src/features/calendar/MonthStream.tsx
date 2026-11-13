"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { YearDays } from "./data";
import { shiftMonth, WEEKDAYS } from "./grid";
import { MonthGrid } from "./MonthView";

/** Meses desenhados de saída em volta do mês aberto, e quantos entram de cada vez ao chegar perto da ponta. */
const START_BEFORE = 3;
const START_AFTER = 4;
const CHUNK = 6;
/** Distância da ponta (em alturas de tela) em que já desenha mais meses, antes de a pessoa chegar lá. */
const EDGE = 1.5;

const Month = memo(MonthGrid);

const monthsBetween = (from: string, to: string) => {
  const out: string[] = [];
  for (let m = from; m <= to; m = shiftMonth(m, 1)) out.push(m);
  return out;
};

/**
 * Rolagem contínua de meses, como no Calendário do iPhone: um mês embaixo do outro, os dias da semana
 * fixos no topo e mais meses desenhados sob demanda nas duas pontas. A rolagem é nativa (caixa própria,
 * com inércia do iOS); só avisamos a casca qual mês está no topo, para o título, a URL e o "Hoje".
 */
export function MonthStream({
  initial,
  daysOf,
  today,
  closedWeekdays,
  pendingDay,
  onDay,
  onVisible,
}: {
  /** Mês que abre no topo (só na montagem; depois quem manda é a rolagem). */
  initial: string;
  daysOf: (year: string) => YearDays | undefined;
  today: string;
  closedWeekdays: number[];
  pendingDay: string | null;
  onDay: (day: string, el: HTMLElement) => void;
  onVisible: (month: string) => void;
}) {
  const [range, setRange] = useState(() => ({
    from: shiftMonth(initial, -START_BEFORE),
    to: shiftMonth(initial, START_AFTER),
  }));
  const box = useRef<HTMLDivElement>(null);
  const wk = useRef<HTMLDivElement>(null);
  const top = useRef(initial);
  /** Altura da rolagem antes de entrar meses em cima: a diferença vira compensação, sem pulo na tela. */
  const before = useRef<number | null>(null);
  const growing = useRef(false);

  // handlers estáveis para o memo dos meses (a casca recria as funções a cada render)
  const handlers = useRef({ onDay, onVisible });
  useLayoutEffect(() => {
    handlers.current = { onDay, onVisible };
  });
  const [stableDay] = useState(() => (day: string, el: HTMLElement) => handlers.current.onDay(day, el));

  // altura da caixa = do topo dela até o fim da tela (a página em si não rola no mês)
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const y = el.getBoundingClientRect().top + window.scrollY;
      el.style.height = `calc(100dvh - ${Math.max(0, Math.round(y))}px)`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // abre com o mês pedido no topo, logo abaixo da linha dos dias da semana
  useLayoutEffect(() => {
    const el = box.current;
    const sec = el?.querySelector<HTMLElement>(`[data-month="${initial}"]`);
    if (el && sec) el.scrollTop = sec.offsetTop - (wk.current?.offsetHeight ?? 0);
    // só na montagem: a casca troca a key quando é para reabrir em outro mês
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // entraram meses em cima: empurra a rolagem pela mesma altura (a tela fica parada)
  useLayoutEffect(() => {
    const el = box.current;
    if (el && before.current !== null) el.scrollTop += el.scrollHeight - before.current;
    before.current = null;
    growing.current = false;
  }, [range]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const line = el.scrollTop + (wk.current?.offsetHeight ?? 0) + 24;
      let cur: string | null = null;
      for (const s of el.querySelectorAll<HTMLElement>("[data-month]")) {
        if (s.offsetTop <= line) cur = s.dataset.month!;
        else break;
      }
      if (cur && cur !== top.current) {
        top.current = cur;
        handlers.current.onVisible(cur);
      }
      if (growing.current) return;
      const h = el.clientHeight;
      if (el.scrollTop < h * EDGE) {
        growing.current = true;
        before.current = el.scrollHeight;
        setRange((r) => ({ ...r, from: shiftMonth(r.from, -CHUNK) }));
      } else if (el.scrollHeight - el.scrollTop - h < h * EDGE) {
        growing.current = true;
        setRange((r) => ({ ...r, to: shiftMonth(r.to, CHUNK) }));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={box} className="cal-scroll" data-stream="">
      <div ref={wk} className="cal-wk cal-wk-stick" aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      {monthsBetween(range.from, range.to).map((m) => (
        <section key={m} data-month={m} className="cal-sec">
          <Month
            month={m}
            days={daysOf(m.slice(0, 4))}
            today={today}
            closedWeekdays={closedWeekdays}
            pendingDay={pendingDay?.startsWith(m) ? pendingDay : null}
            onDay={stableDay}
            stream
          />
        </section>
      ))}
    </div>
  );
}
