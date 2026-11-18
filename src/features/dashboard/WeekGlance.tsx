import Link from "next/link";
import { formatTime } from "@/lib/dates";
import type { Dashboard } from "./data";
import { BOX } from "./ui";

const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
/** Quantos atendimentos cada dia mostra antes do "+N". */
const SHOWN = 4;

/** Semana do dia escolhido, de relance: cada dia com os primeiros horários e quantos atendimentos tem. Clicar abre o dia. */
export function WeekGlance({ week, date, today }: { week: Dashboard["viewWeek"]; date: string; today: string }) {
  return (
    <div className={`${BOX} grid grid-cols-7 gap-2 !px-3`}>
      {week.map((d, i) => {
        const active = d.rows.filter((r) => r.status !== "no_show");
        return (
          <Link
            key={d.date}
            href={d.date === today ? "/agenda" : `/agenda?d=${d.date}`}
            scroll={false}
            aria-current={d.date === date ? "date" : undefined}
            className={`flex min-h-40 min-w-0 flex-col rounded-2xl bg-surface p-2 ring-1 transition-shadow hover:shadow-md ${
              d.date === date ? "ring-2 ring-primary" : "ring-line"
            }`}
          >
            <span className="flex items-baseline justify-between text-xs font-bold text-muted">
              {WD[i]}
              <b className={`text-base ${d.date === today ? "text-[var(--rose)]" : "text-fg"}`}>{Number(d.date.slice(8))}</b>
            </span>
            {d.rows.slice(0, SHOWN).map((r) => (
              <span
                key={r.id}
                className="mt-1.5 truncate rounded-lg px-1.5 py-1 text-[11px] font-bold"
                style={{
                  background: `var(--svc-${r.color || "lav"}-soft)`,
                  color: `var(--svc-${r.color || "lav"}-ink)`,
                  boxShadow: `inset 3px 0 0 var(--svc-${r.color || "lav"})`,
                }}
              >
                {formatTime(r.startsAt)} {r.name.split(/\s+/)[0]}
              </span>
            ))}
            <span className="mt-auto pt-2 text-[11px] font-semibold text-muted">
                            {active.length ? `${active.length} ${active.length === 1 ? "atendimento" : "atendimentos"}` : d.closed ? "Fechado" : "Livre"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
