import Link from "next/link";
import { serviceTone } from "@/features/appointments/agenda-grid";
import { formatDayTitle, todayStr } from "@/lib/dates";
import { CalendarBar, TodayFab } from "./CalendarBar";
import { MONTH_NAMES, monthWeeks, shiftMonth, WEEKDAYS } from "./grid";

export type CalendarAppt = { date: string; clientName: string; serviceId: string };

const MAX_PILLS = 3;
const first = (n: string) => n.trim().split(/\s+/)[0];

/** Mês em grade: o número do dia e uma pílula por atendimento (nome da cliente), toque abre o dia. */
export function MonthView({
  month,
  appts,
  closedWeekdays,
  from,
}: {
  month: string;
  appts: CalendarAppt[];
  /** Dias da semana (0 = domingo) em que o salão não abre. */
  closedWeekdays: number[];
  from?: "year";
}) {
  const today = todayStr();
  const year = month.slice(0, 4);
  const byDay = new Map<string, CalendarAppt[]>();
  for (const a of appts) byDay.set(a.date, [...(byDay.get(a.date) ?? []), a]);
  const thisMonth = today.slice(0, 7) === month;

  return (
    <div className="cal-view" data-from={from}>
      <CalendarBar
        back={{ href: `/calendario?v=ano&y=${year}`, label: year }}
        title={MONTH_NAMES[Number(month.slice(5, 7)) - 1]}
        titleTone={thisMonth ? "rose" : undefined}
        prev={{ href: `/calendario?v=mes&m=${shiftMonth(month, -1)}`, label: "Mês anterior" }}
        next={{ href: `/calendario?v=mes&m=${shiftMonth(month, 1)}`, label: "Próximo mês" }}
      />
      <div className="cal-wk" aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="cal-month">
        {monthWeeks(month)
          .flat()
          .map((day, i) => {
            if (!day) return <span key={i} className="cal-cell" data-out aria-hidden="true" />;
            const list = byDay.get(day) ?? [];
            const n = list.length;
            return (
              <Link
                key={day}
                href={`/calendario?d=${day}`}
                scroll={false}
                className="cal-cell"
                data-today={day === today || undefined}
                data-closed={closedWeekdays.includes(i % 7) || undefined}
                aria-label={`${formatDayTitle(day)}${day === today ? " (hoje)" : ""}, ${n === 0 ? "sem atendimentos" : `${n} atendimento${n === 1 ? "" : "s"}`}`}
              >
                <b>{Number(day.slice(8))}</b>
                {list.slice(0, n > MAX_PILLS ? MAX_PILLS - 1 : MAX_PILLS).map((a, k) => (
                  <span key={k} className="cal-pill" data-tone={serviceTone(a.serviceId)}>
                    {first(a.clientName)}
                  </span>
                ))}
                {n > MAX_PILLS ? <span className="cal-more">+{n - (MAX_PILLS - 1)}</span> : null}
              </Link>
            );
          })}
      </div>
      {thisMonth ? null : <TodayFab href="/calendario?v=mes" />}
    </div>
  );
}
