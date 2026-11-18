"use client";

import { useValuesHidden } from "@/features/finance/hide-values";
import { formatBRL } from "@/lib/dates";
import type { Dashboard } from "./data";
import { BOX, BOX_TITLE } from "./ui";

const MASKED = "R$ •••••";
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const monthName = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Bar({ pct, tone = "var(--primary)" }: { pct: number; tone?: string }) {
  return (
    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-soft" aria-hidden="true">
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.round(Math.min(Math.max(pct, 0), 1) * 100)}%`, background: tone }} />
    </div>
  );
}

/**
 * Números do Painel no desktop/tablet: semana, mês (com a comparação ao mesmo período do mês anterior) e
 * confirmações de hoje. Os valores respeitam o olhinho de "ocultar valores" do cartão de hoje.
 */
export function PeriodCards({ week, month, confirm }: Pick<Dashboard, "week" | "month" | "confirm">) {
  const masked = useValuesHidden() !== false;
  const money = (c: number) => (masked ? MASKED : formatBRL(c));
  const name = monthName(month.label);
  const prevName = MONTHS[(Number(month.label.slice(5, 7)) + 10) % 12];
  return (
    <>
      <section aria-label="Ganhos da semana" className={BOX}>
        <h2 className={BOX_TITLE}>Semana</h2>
        <p className="truncate text-2xl font-bold tabular-nums" data-money>{money(week.received)}</p>
        <p className="truncate text-xs font-semibold text-muted">
          {plural(week.count, "atendimento", "atendimentos")} · previsto <span data-money>{money(week.forecast)}</span>
        </p>
        <Bar pct={week.forecast ? week.received / week.forecast : 0} />
      </section>
      <section aria-label={`Ganhos de ${name}`} className={BOX}>
        <h2 className={BOX_TITLE}>{name.charAt(0).toUpperCase() + name.slice(1)}</h2>
        <p className="truncate text-2xl font-bold tabular-nums" data-money>{money(month.received)}</p>
        <p className="truncate text-xs font-semibold text-muted">
          {month.delta === null ? null : (
            <span className={month.delta >= 0 ? "text-ok" : "text-fail"}>
              {month.delta >= 0 ? "▲" : "▼"} {Math.abs(month.delta)}% vs. {prevName} ·{" "}
            </span>
          )}
          saldo <span data-money>{money(month.balance)}</span>
        </p>
        <Bar pct={month.forecast ? month.received / month.forecast : 0} />
      </section>
      <section aria-label="Confirmações de hoje" className={BOX}>
        <h2 className={BOX_TITLE}>Confirmações</h2>
        <p className="text-2xl font-bold tabular-nums">
          {confirm.confirmed} <span className="text-base text-muted">de {confirm.total}</span>
        </p>
        <p className="truncate text-xs font-semibold text-muted">
          {confirm.total === 0
            ? "Nenhum atendimento hoje"
            : [
                confirm.waiting ? `${confirm.waiting} sem resposta` : null,
                confirm.reschedule ? `${confirm.reschedule} pediu para remarcar` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Todas confirmaram"}
        </p>
        <Bar pct={confirm.total ? confirm.confirmed / confirm.total : 0} tone="var(--ok)" />
      </section>
    </>
  );
}
