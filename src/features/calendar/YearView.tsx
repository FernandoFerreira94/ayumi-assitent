import Link from "next/link";
import { todayStr } from "@/lib/dates";
import { CalendarBar, TodayFab } from "./CalendarBar";
import { MONTH_NAMES, monthWeeks } from "./grid";

/** Ano com os 12 meses; dia com atendimento fica em destaque. Toque no mês abre o mês. */
export function YearView({ year, busyDays }: { year: string; busyDays: Set<string> }) {
  const today = todayStr();
  const y = Number(year);
  return (
    <div className="cal-view" data-from="month">
      <CalendarBar
        title={year}
        titleTone={today.startsWith(year) ? "rose" : undefined}
        prev={{ href: `/calendario?v=ano&y=${y - 1}`, label: "Ano anterior" }}
        next={{ href: `/calendario?v=ano&y=${y + 1}`, label: "Próximo ano" }}
      />
      <div className="cal-year">
        {MONTH_NAMES.map((name, i) => {
          const month = `${year}-${String(i + 1).padStart(2, "0")}`;
          const cells = monthWeeks(month).flat();
          return (
            <Link
              key={month}
              href={`/calendario?v=mes&m=${month}&from=year`}
              scroll={false}
              className="cal-mini"
              data-current={today.startsWith(month) || undefined}
              aria-label={`${name} de ${year}`}
            >
              <h3>{name}</h3>
              <div className="cal-mini-grid" aria-hidden="true">
                {cells.map((d, k) => (
                  <span key={k} data-today={d === today || undefined} data-has={(d && busyDays.has(d)) || undefined}>
                    {d ? Number(d.slice(8)) : ""}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
      {today.startsWith(year) ? null : <TodayFab href="/calendario?v=ano" />}
    </div>
  );
}
