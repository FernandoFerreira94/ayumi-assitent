"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { calendarYear } from "@/features/calendar/actions";
import type { YearDays } from "@/features/calendar/data";
import { MONTH_NAMES, WEEKDAYS, monthWeeks, shiftMonth } from "@/features/calendar/grid";
import { weekdayOf } from "@/features/hours/slots";
import { BOX } from "./ui";

const dots = (n: number) => Math.min(n, 3);

/**
 * Mini mês do Painel (desktop/tablet): as setas trocam o mês (outro ano busca no servidor, com
 * carregando e erro), as bolinhas mostram quantos atendimentos o dia tem e o clique troca o dia da agenda
 * ao lado, sem recarregar a página.
 */
export function MiniMonth({
  date,
  today,
  initialYear,
  closedDays,
}: {
  date: string;
  today: string;
  initialYear: YearDays;
  /** Por dia da semana (0 = domingo): salão fechado. */
  closedDays: boolean[];
}) {
  const router = useRouter();
  const [month, setMonth] = useState(date.slice(0, 7));
  const [years, setYears] = useState<Record<string, YearDays>>({ [date.slice(0, 4)]: initialYear });
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const year = month.slice(0, 4);
  const days = years[year];

  async function go(target: string) {
    setMonth(target);
    const y = target.slice(0, 4);
    if (years[y]) return;
    setLoading(true);
    const res = await calendarYear(y);
    setLoading(false);
    if (res.ok) setYears((m) => ({ ...m, [y]: res.data }));
    else notify.error(res.code, () => void go(target));
  }

  const pick = (d: string) => startTransition(() => router.push(d === today ? "/agenda" : `/agenda?d=${d}`, { scroll: false }));
  const title = `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${year}`;
  const arrow = "grid size-9 place-items-center rounded-full bg-surface text-primary-text shadow-sm ring-1 ring-line";

  return (
    <section aria-label="Mês" className={BOX}>
      <div className="flex items-center gap-2 pb-2">
        <button type="button" onClick={() => void go(shiftMonth(month, -1))} aria-label="Mês anterior" className={arrow}>
          <Icon name="arrowRight" size={16} className="rotate-180" />
        </button>
        <h2 className="flex-1 text-center text-base font-bold" aria-live="polite">
          {title}
        </h2>
        <button type="button" onClick={() => void go(shiftMonth(month, 1))} aria-label="Próximo mês" className={arrow}>
          <Icon name="arrowRight" size={16} />
        </button>
        {month !== today.slice(0, 7) || date !== today ? (
          <button
            type="button"
            onClick={() => {
              void go(today.slice(0, 7));
              pick(today);
            }}
            className="min-h-9 rounded-full bg-soft px-3 text-sm font-bold text-primary-text"
          >
            Hoje
          </button>
        ) : null}
      </div>
      <div aria-busy={loading} className={`grid grid-cols-7 gap-0.5 text-center transition-opacity ${loading ? "opacity-50" : ""}`}>
        <div className="contents">
          {WEEKDAYS.map((w, i) => (
            <span key={i} aria-hidden="true" className="py-1 text-[11px] font-bold text-muted">
              {w}
            </span>
          ))}
        </div>
        {monthWeeks(month).map((week, wi) => (
          <div key={wi} className="contents">
            {week.map((d, i) => {
              if (!d) return <span key={i} />;
              const n = days?.[d]?.n ?? 0;
              const isToday = d === today;
              const selected = d === date;
              const closed = closedDays[weekdayOf(d)] && n === 0;
              return (
                <button
                  key={d}
                  type="button"
                  aria-current={selected ? "date" : undefined}
                  aria-label={`${Number(d.slice(8))}${n ? `, ${n} ${n === 1 ? "atendimento" : "atendimentos"}` : ""}${closed ? ", fechado" : ""}`}
                  onClick={() => pick(d)}
                  className={`relative min-h-10 rounded-xl pb-2 pt-1.5 text-sm font-bold tabular-nums transition-colors hover:bg-soft ${
                    isToday ? "bg-[var(--rose)] text-white hover:bg-[var(--rose)]" : closed ? "text-muted/50" : ""
                  } ${selected && !isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                >
                  {Number(d.slice(8))}
                  {n ? (
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                      {Array.from({ length: dots(n) }, (_, k) => (
                        <i key={k} className={`size-1 rounded-full ${isToday ? "bg-white" : "bg-primary"}`} />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="pt-2 text-xs font-semibold text-muted">Clique num dia para ver a agenda dele.</p>
    </section>
  );
}
