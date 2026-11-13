import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
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
  stream = false,
}: {
  month: string;
  /** undefined = o ano ainda está carregando. */
  days: YearDays | undefined;
  today: string;
  /** Dias da semana (0 = domingo) em que o salão não abre. */
  closedWeekdays: number[];
  pendingDay?: string | null;
  onDay: (day: string, el: HTMLElement) => void;
  /** Dentro da rolagem contínua: a linha dos dias da semana fica fixa no topo (uma só) e o ano aparece se não for o atual. */
  stream?: boolean;
}) {
  const thisMonth = today.slice(0, 7) === month;
  const otherYear = stream && month.slice(0, 4) !== today.slice(0, 4);
  return (
    <div>
      <h2 className={`px-1 pb-1 text-[34px] font-bold leading-tight ${thisMonth ? "text-rose" : ""}`}>
        {MONTH_NAMES[Number(month.slice(5, 7)) - 1]}
        {otherYear ? <span className="ml-2 text-[20px] font-bold text-muted">{month.slice(0, 4)}</span> : null}
      </h2>
      {stream ? null : (
        <div className="cal-wk" aria-hidden="true">
          {WEEKDAYS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      )}
      <div className="cal-month" data-loading={days ? undefined : true}>
        {monthWeeks(month)
          .flat()
          .map((day, i) => {
            if (!day) return <span key={i} className="cal-cell" data-out aria-hidden="true" />;
            const info = days?.[day];
            const n = info?.n ?? 0;
            const x = info?.x ?? 0;
            const total = n + x;
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
                aria-label={`${formatDayTitle(day)}${day === today ? " (hoje)" : ""}${days ? `, ${n === 0 ? "sem atendimentos" : `${n} atendimento${n === 1 ? "" : "s"}`}${x ? `, ${x} evento${x === 1 ? "" : "s"} de fora` : ""}` : ""}`}
              >
                <b>{Number(day.slice(8))}</b>
                {pills.slice(0, total > MAX_PILLS ? MAX_PILLS - 1 : MAX_PILLS).map((a, k) =>
                  a.ext ? (
                    <span key={k} className="cal-pill" data-ext={a.ext}>
                      <Icon name={a.ext === "google" ? "google" : "phone"} size={8} />
                      {a.name}
                    </span>
                  ) : (
                    <span key={k} className="cal-pill" data-color={a.color} data-st={a.st}>
                      {a.name}
                    </span>
                  ),
                )}
                {total > MAX_PILLS ? <span className="cal-more">+{total - (MAX_PILLS - 1)}</span> : null}
              </Link>
            );
          })}
      </div>
    </div>
  );
}
