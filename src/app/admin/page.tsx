import type { Metadata } from "next";
import { TileTitle } from "@/components/ui/Icon";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { getPlatformStats } from "@/features/admin/platform";
import { idleSalons, pctChange, recentSalons } from "@/features/admin/platform-rules";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { BillingPending } from "@/features/admin/ui/BillingPending";
import { fmtPct } from "@/features/admin/ui/format";
import { KpiCard } from "@/features/admin/ui/KpiCard";
import { MonthBars } from "@/features/admin/ui/MonthBars";
import { IdleSalonsCard, NewSalonsCard } from "@/features/admin/ui/SalonLists";
import { adminCard } from "@/features/admin/ui/styles";
import { getUsage } from "@/features/admin/usage";
import { summarizeUsage } from "@/features/admin/usage-rules";

export const metadata: Metadata = { title: "Visão geral" };

const num = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

/** Texto da variação contra o mês passado ("+12% vs out"). */
function vsPrev(cur: number, prev: number): string {
  const p = pctChange(cur, prev);
  if (p === null) return prev === 0 && cur === 0 ? "nenhum ainda" : "primeiro mês com dados";
  return `${p > 0 ? "+" : ""}${fmtPct(p)} vs anterior`;
}

/**
 * Visão geral com números REAIS da plataforma (salões, uso, agendamentos e WhatsApp). Só agregados e nome do salão:
 * nenhum dado de cliente final. A parte de cobrança mostra estado vazio até o Mercado Pago entrar.
 */
export default async function AdminOverviewPage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_overview" });
  const now = new Date();
  const [usage, { totals: t, months }] = await Promise.all([getUsage(), getPlatformStats()]);
  const u = summarizeUsage(usage, now);
  const newThisMonth = months.at(-1)?.salons ?? 0;

  return (
    <AdminShell title="Visão geral" subtitle="Números reais do Bubbly, atualizados a cada visita" icon="compass">
      <h2 className="sr-only">Números do mês</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon="users"
          tint="lavender"
          tone="brand"
          label="Salões"
          value={num(u.salons)}
          note={newThisMonth ? `+${num(newThisMonth)} neste mês` : "nenhum novo neste mês"}
        />
        <KpiCard
          icon="checkCircle"
          tint="green"
          tone="ok"
          label="Ativos em 7 dias"
          value={num(u.active7)}
          note={u.salons ? `${fmtPct(u.active7 / u.salons)} dos salões` : "sem salões ainda"}
        />
        <KpiCard
          icon="chat"
          tint="teal"
          tone={u.salons && u.whatsapp < u.salons ? "wait" : "fg"}
          label="WhatsApp ligado"
          value={num(u.whatsapp)}
          note={`de ${num(u.salons)} salões`}
        />
        <KpiCard
          icon="calendar"
          tint="blue"
          tone="brand"
          label="Agendamentos"
          value={num(t.apptsMonth)}
          note={`no mês · ${vsPrev(t.apptsMonth, t.apptsPrevMonth)}`}
        />
        <KpiCard
          icon="message"
          tint="pink"
          label="Mensagens"
          value={num(t.msgsOutMonth)}
          note={`enviadas no mês · ${num(t.msgsInMonth)} recebidas`}
        />
        <KpiCard
          icon="users"
          tint="orange"
          label="Clientes"
          value={num(t.clients)}
          note={`nos salões · ${num(t.users)} ${t.users === 1 ? "pessoa usa" : "pessoas usam"} o app`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className={adminCard} aria-labelledby="ov-appts">
          <TileTitle as="h2" id="ov-appts" icon="calendar" tint="blue" className="text-lg">
            Agendamentos em 12 meses
          </TileTitle>
          <MonthBars label="Agendamentos" points={months.map((m) => ({ month: m.month, value: m.appts }))} />
        </section>
        <section className={adminCard} aria-labelledby="ov-salons">
          <TileTitle as="h2" id="ov-salons" icon="sparkles" tint="pink" className="text-lg">
            Salões novos em 12 meses
          </TileTitle>
          <MonthBars label="Salões novos" points={months.map((m) => ({ month: m.month, value: m.salons }))} />
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <NewSalonsCard rows={recentSalons(usage, now, 30)} />
        <IdleSalonsCard rows={idleSalons(usage, now, 7)} now={now} />
      </div>

      <div className="mt-5">
        <BillingPending what="MRR, recebido no mês, pagantes, atraso e churn" />
      </div>
    </AdminShell>
  );
}
