"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useValuesHidden } from "@/features/finance/hide-values";
import { formatBRL } from "@/lib/dates";
import type { DayForecast, DayPendencias } from "./day-panel";

export type NextItem = { id: string; time: string; clientName: string; serviceName: string };

const MASKED = "R$ •••••";

/**
 * Cartões abaixo da Bolha na coluna "Contexto do dia" (só tela larga): Previsão de ganho, Próximos e
 * Pendências do dia. Os valores obedecem ao olhinho dos ganhos, como no resto do app.
 */
export function DayCards({
  forecast,
  next,
  pendencias,
  isToday,
}: {
  forecast: DayForecast;
  next: NextItem[];
  pendencias: DayPendencias;
  isToday: boolean;
}) {
  const masked = useValuesHidden() !== false;
  const money = (c: number) => (masked ? MASKED : formatBRL(c));
  const forecastRows = [
    { label: "Concluído", cents: forecast.doneCents },
    { label: "Confirmado", cents: forecast.confirmedCents },
    { label: "Aguardando cliente", cents: forecast.waitingCents },
  ];
  const pendRows = [
    { label: "Para fechar", count: pendencias.toClose },
    { label: "Aguardando confirmação", count: pendencias.toConfirm },
    { label: "Querem remarcar", count: pendencias.toReschedule },
  ].filter((p) => p.count > 0);

  return (
    <div className="hidden gap-3 lg:grid">
      <section aria-labelledby="card-previsao" className="glass rounded-[1.4rem] p-4">
        <h2 id="card-previsao" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
          <Icon name="forecast" size={16} /> Previsão de ganho
        </h2>
        <p className="mt-1 text-2xl font-bold tabular-nums" data-money>
          {money(forecast.totalCents)}
        </p>
        <dl className="mt-2 grid gap-1 text-sm">
          {forecastRows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="text-muted">{r.label}</dt>
              <dd className="font-semibold tabular-nums" data-money>
                {money(r.cents)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="card-proximos" className="glass rounded-[1.4rem] p-4">
        <h2 id="card-proximos" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
          <Icon name="clock" size={16} /> Próximos
        </h2>
        {next.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {isToday ? "Nenhum horário pela frente hoje." : "Nenhum horário em aberto nesse dia."}
          </p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {next.map((n) => (
              <li key={n.id} className="flex items-baseline gap-3">
                <span className="w-11 shrink-0 font-bold tabular-nums">{n.time}</span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-semibold">{n.clientName}</span>
                  <span className="block truncate text-sm text-muted">{n.serviceName}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="card-pendencias" className="glass rounded-[1.4rem] p-4">
        <h2
          id="card-pendencias"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"
        >
          <Icon name="alert" size={16} /> Pendências do dia
        </h2>
        {pendencias.total === 0 ? (
          <p className="mt-2 text-sm text-muted">Tudo em dia.</p>
        ) : (
          <>
            <ul className="mt-2 grid gap-1">
              {pendRows.map((p) => (
                <li key={p.label} className="flex items-center justify-between gap-3 text-sm font-semibold">
                  <span>{p.label}</span>
                  <span className="rounded-full bg-wait-bg px-2.5 py-0.5 font-bold text-wait">{p.count}</span>
                </li>
              ))}
            </ul>
            <Link href="/pendencias" className="mt-3 inline-block text-sm font-bold text-primary-text">
              Ver pendências
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
