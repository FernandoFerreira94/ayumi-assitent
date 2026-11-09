import Link from "next/link";
import { formatDayTitle } from "@/lib/dates";
import { MAX_PILLS, type YearDays } from "./data";
import { MONTH_NAMES, monthWeeks, WEEKDAYS } from "./grid";

/** Mês em grade: título, número do dia e uma pílula por atendimento (nome da cliente). Toque abre o dia. */
export function MonthGrid({
  month,
  days,
  today,
  closedWeekdays,
  pendingDay,
  onDay,
}: {
  month: string;
  /** undefined = o ano ainda está carregando. */
  days: YearDays | undefined;
  today: string;
  /** Dias da semana (0 = domingo) em que o salão não abre. */
  closedWeekdays: number[];
  pendingDay?: string | null;
  onDay: (day: string, el: HTMLElement) => void;
}) {
  const thisMonth = today.slice(0, 7) === month;
  return (
    <div>
      <h2 className={`px-1 pb-1 text-[34px] font-bold leading-tight ${thisMonth ? "text-rose" : ""}`}>
        {MONTH_NAMES[Number(month.slice(5, 7)) - 1]}
      </h2>
      <div className="cal-wk" aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="cal-month" data-loading={days ? undefined : true}>
        {monthWeeks(month)
          .flat()
          .map((day, i) => {
            if (!day) return <span key={i} className="cal-cell" data-out aria-hidden="true" />;
            const info = days?.[day];
            const n = info?.n ?? 0;
            const pills = info?.pills ?? [];
            return (
              <Link
                key={day}
                href={`/calendario?d=${day}`}
                scroll={false}
                prefetch={false}
                draggable={false}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) return;
                  e.preventDefault();
                  onDay(day, e.currentTarget);
                }}
                className="cal-cell"
                data-zoom={`d${day}`}
                data-today={day === today || undefined}
                data-pending={pendingDay === day || undefined}
                data-closed={closedWeekdays.includes(i % 7) || undefined}
                aria-label={`${formatDayTitle(day)}${day === today ? " (hoje)" : ""}${days ? `, ${n === 0 ? "sem atendimentos" : `${n} atendimento${n === 1 ? "" : "s"}`}` : ""}`}
              >
                <b>{Number(day.slice(8))}</b>
                {pills.slice(0, n > MAX_PILLS ? MAX_PILLS - 1 : MAX_PILLS).map((a, k) => (
                  <span key={k} className="cal-pill" data-color={a.color} data-st={a.st}>
                    {a.name}
                  </span>
                ))}
                {n > MAX_PILLS ? <span className="cal-more">+{n - (MAX_PILLS - 1)}</span> : null}
              </Link>
            );
          })}
      </div>
    </div>
  );
}
