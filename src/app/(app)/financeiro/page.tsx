import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listDay } from "@/features/appointments/core";
import { isPeriod, PERIODS, periodRange } from "@/features/finance/period";
import { ServicePie } from "@/features/finance/ServicePie";
import { summarize } from "@/features/finance/summary";
import { formatBRL, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinanceiroPage({ searchParams }: PageProps<"/financeiro">) {
  await connection(); // o período depende de hoje
  const { p } = await searchParams;
  const period = isPeriod(p) ? p : "mes";
  const { range, label } = periodRange(period, todayStr());
  const { tenantId } = await requireTenant();
  const s = summarize(await withTenant(tenantId, (tx) => listDay(tx, range)));

  return (
    <PageShell title="Financeiro" subtitle={label}>
      <nav aria-label="Período" className="glass mb-4 grid grid-cols-4 gap-1 rounded-full p-1">
        {PERIODS.map((x) => (
          <Link
            key={x.id}
            href={`/financeiro?p=${x.id}`}
            scroll={false}
            aria-current={x.id === period ? "page" : undefined}
            className={`grid min-h-11 place-content-center rounded-full text-sm font-bold ${x.id === period ? "bg-primary text-on-primary" : ""}`}
          >
            {x.label}
          </Link>
        ))}
      </nav>

      <section aria-label="Resumo" className="glass mb-4 grid gap-3 rounded-3xl px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Recebido</p>
          <p className="text-3xl font-bold">{formatBRL(s.received)}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs font-bold text-muted">Previsto</dt>
            <dd className="font-bold tabular-nums">{formatBRL(s.forecast)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-muted">Concluídos</dt>
            <dd className="font-bold tabular-nums">{s.doneCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-muted">Ticket médio</dt>
            <dd className="font-bold tabular-nums">{formatBRL(s.averageCents)}</dd>
          </div>
        </dl>
      </section>

      {s.received === 0 ? (
        <EmptyState
          title="Nada recebido nesse período"
          description="O recebido conta os atendimentos marcados como concluídos na agenda."
        />
      ) : (
        <section aria-labelledby="por-servico" className="glass grid gap-3 rounded-3xl px-4 py-4">
          <h2 id="por-servico" className="text-sm font-bold uppercase tracking-wide text-muted">
            Por serviço
          </h2>
          <ServicePie slices={s.slices} total={s.received} />
        </section>
      )}
    </PageShell>
  );
}
