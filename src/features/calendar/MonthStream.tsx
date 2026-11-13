"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { YearDays } from "./data";
import { shiftMonth, WEEKDAYS } from "./grid";
import { MonthGrid } from "./MonthView";

/** No máximo 3 meses na rolagem: o anterior, o aberto e o próximo (13/11, pedido da usuária). */
const BEFORE = 1;
const AFTER = 1;

const Month = memo(MonthGrid);

const monthsBetween = (from: string, to: string) => {
  const out: string[] = [];
  for (let m = from; m <= to; m = shiftMonth(m, 1)) out.push(m);
  return out;
};

/**
 * Rolagem de meses como no Calendário do iPhone: um mês embaixo do outro e os dias da semana fixos no topo,
 * limitada a 3 meses (o anterior, o aberto e o próximo; ao abrir pelo Calendário, o aberto é o de hoje).
 * Setas, deslizar, Hoje e o ano reabrem a lista em volta de outro mês. A rolagem é nativa (caixa própria,
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
  const [months] = useState(() => monthsBetween(shiftMonth(initial, -BEFORE), shiftMonth(initial, AFTER)));
  const box = useRef<HTMLDivElement>(null);
  const wk = useRef<HTMLDivElement>(null);
  const tail = useRef<HTMLDivElement>(null);
  const top = useRef(initial);

  // handlers estáveis para o memo dos meses (a casca recria as funções a cada render)
  const handlers = useRef({ onDay, onVisible });
  useLayoutEffect(() => {
    handlers.current = { onDay, onVisible };
  });
  const [stableDay] = useState(() => (day: string, el: HTMLElement) => handlers.current.onDay(day, el));

  // altura da caixa = do topo dela até o fim da tela (a página em si não rola no mês), e uma folga no fim
  // para o último mês também conseguir subir até o topo (senão o título nunca chega nele)
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const y = el.getBoundingClientRect().top + window.scrollY;
      el.style.height = `calc(100dvh - ${Math.max(0, Math.round(y))}px)`;
      const last = el.querySelector<HTMLElement>("[data-month]:last-of-type");
      if (tail.current && last) {
        const room = el.clientHeight - (wk.current?.offsetHeight ?? 0) - last.offsetHeight;
        tail.current.style.height = `${Math.max(0, room)}px`;
      }
    };
    fit();
    // abre com o mês pedido no topo, logo abaixo da linha dos dias da semana (só na montagem: a casca
    // troca a key quando é para reabrir em outro mês)
    const sec = el.querySelector<HTMLElement>(`[data-month="${initial}"]`);
    if (sec) el.scrollTop = sec.offsetTop - (wk.current?.offsetHeight ?? 0);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {months.map((m) => (
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
      <div ref={tail} aria-hidden="true" />
    </div>
  );
}
