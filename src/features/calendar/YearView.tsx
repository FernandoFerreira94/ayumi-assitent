import Link from "next/link";
import type { YearDays } from "./data";
import { MONTH_NAMES, monthWeeks } from "./grid";

/** Ano com os 12 meses; dia com atendimento fica em destaque. Toque no mês abre o mês com zoom. */
export function YearGrid({
  year,
  days,
  today,
  onMonth,
}: {
  year: string;
  days: YearDays | undefined;
  today: string;
  onMonth: (month: string, el: HTMLElement) => void;
}) {
  return (
    <div>
      <h2 className={`px-1 pb-2 text-[34px] font-bold leading-tight ${today.startsWith(year) ? "text-rose" : ""}`}>
        {year}
      </h2>
      <div className="cal-year">
        {MONTH_NAMES.map((name, i) => {
          const month = `${year}-${String(i + 1).padStart(2, "0")}`;
          return (
            <Link
              key={month}
              href={`/calendario?v=mes&m=${month}`}
              scroll={false}
              prefetch={false}
              draggable={false}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey) return;
                e.preventDefault();
                onMonth(month, e.currentTarget);
              }}
              className="cal-mini"
              data-zoom={`m${month}`}
              data-current={today.startsWith(month) || undefined}
              aria-label={`${name} de ${year}`}
            >
              <h3>{name}</h3>
              <div className="cal-mini-grid" aria-hidden="true">
                {monthWeeks(month)
                  .flat()
                  .map((d, k) => (
                    <span key={k} data-today={d === today || undefined} data-has={(d && days?.[d]) || undefined}>
                      {d ? Number(d.slice(8)) : ""}
                    </span>
                  ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
