import type { Metadata } from "next";
import { logAdminAccess } from "@/features/admin/audit";
import { monthKey } from "@/features/admin/demo-data";
import { requireAdmin } from "@/features/admin/guard";
import {
  cancellations,
  delinquencyBuckets,
  healthLevel,
  receivedInMonth,
  summarize,
  trialConversion,
  trialsEnding,
  upcomingDue,
} from "@/features/admin/metrics";
import { getBillingHealth, getEvents, getMrrMonths, getOverview, getPayments, IS_DEMO } from "@/features/admin/queries";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { DemoBanner } from "@/features/admin/ui/DemoBanner";
import { fmtPct, formatBRL } from "@/features/admin/ui/format";
import { HealthBar } from "@/features/admin/ui/HealthBar";
import { KpiCard } from "@/features/admin/ui/KpiCard";
import { MrrChart, MrrMovements } from "@/features/admin/ui/MrrChart";
import { CancellationsCard, DueSoonCard, OverdueCard, TrialsCard } from "@/features/admin/ui/OverviewLists";
import { adminCard } from "@/features/admin/ui/styles";

export const metadata: Metadata = { title: "Visão geral" };

const DAY = 86_400_000;

/** Visão geral: saúde da cobrança, números do mês, MRR de 12 meses e as listas que pedem ação. */
export default async function AdminOverviewPage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_overview" });
  const now = new Date();
  const [rows, months, payments, events, health] = await Promise.all([
    getOverview(now),
    getMrrMonths(now),
    getPayments(monthKey(now), now),
    getEvents(now),
    getBillingHealth(now),
  ]);

  const s = summarize(rows, now);
  const got = receivedInMonth(payments);
  const last = months.at(-1)!;
  const prev = months.at(-2);
  const churnRate = prev && prev.mrrCents ? last.churnCents / prev.mrrCents : null;
  const monthAgo = new Date(now.getTime() - 30 * DAY);
  const late = rows.filter((r) => r.status === "past_due").sort((a, b) => (b.daysPastDue ?? 0) - (a.daysPastDue ?? 0));

  return (
    <AdminShell title="Visão geral" subtitle="Assinaturas e receita do Bubbly">
      {IS_DEMO ? <DemoBanner /> : null}
      <HealthBar health={health} level={healthLevel(health, now)} now={now} />

      <h2 className="sr-only">Números do mês</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon="forecast"
          label="MRR"
          value={formatBRL(s.mrrCents)}
          note={s.mrrAtRiskCents ? `${formatBRL(s.mrrAtRiskCents)} em risco` : s.arpaCents ? `${formatBRL(s.arpaCents)} por salão` : undefined}
          alert={s.mrrAtRiskCents > 0}
        />
        <KpiCard
          icon="wallet"
          label="Recebido no mês"
          value={formatBRL(got.netCents)}
          note={`Bruto ${formatBRL(got.grossCents)} · taxa ${formatBRL(got.feeCents)}`}
        />
        <KpiCard
          icon="users"
          label="Pagantes"
          value={String(s.payingCount)}
          note={s.courtesyCount ? `+ ${s.courtesyCount} cortesia${s.courtesyCount > 1 ? "s" : ""}` : undefined}
        />
        <KpiCard
          icon="sparkles"
          label="Em teste"
          value={String(s.trialCount)}
          note={s.trialsEndingSoon ? `${s.trialsEndingSoon} acaba${s.trialsEndingSoon > 1 ? "m" : ""} em 3 dias` : "nenhum acaba em 3 dias"}
        />
        <KpiCard
          icon="alert"
          label="Em atraso"
          value={String(s.pastDueCount)}
          note={s.pastDueCount ? `${formatBRL(s.mrrAtRiskCents)} por mês` : "ninguém devendo"}
          alert={s.pastDueCount > 0}
        />
        <KpiCard
          icon="userX"
          label="Churn do mês"
          value={churnRate === null ? "—" : fmtPct(churnRate)}
          note={`${last.churnCount} salão${last.churnCount === 1 ? "" : "s"} · ${formatBRL(last.churnCents)}`}
        />
      </div>

      <section className={`${adminCard} mt-5`} aria-labelledby="ov-mrr">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ov-mrr" className="text-lg font-bold">
            MRR em 12 meses
          </h2>
          <p className="text-sm font-semibold text-muted">Receita mensal recorrente (anual dividido por 12)</p>
        </div>
        <MrrChart months={months} />
        <MrrMovements month={last} />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <DueSoonCard rows={upcomingDue(rows, now, 7)} />
        <OverdueCard buckets={delinquencyBuckets(rows)} rows={late} />
        <TrialsCard rows={trialsEnding(rows, now, 3)} conversion={trialConversion(events, monthAgo, now)} />
        <CancellationsCard events={cancellations(events, monthAgo, now)} />
      </div>
    </AdminShell>
  );
}
