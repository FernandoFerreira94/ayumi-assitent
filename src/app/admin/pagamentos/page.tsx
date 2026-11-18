import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { logAdminAccess } from "@/features/admin/audit";
import { monthKey, shiftMonth } from "@/features/admin/demo-data";
import { requireAdmin } from "@/features/admin/guard";
import { receivedInMonth } from "@/features/admin/metrics";
import { parseMonth } from "@/features/admin/month";
import { getPayments, IS_DEMO } from "@/features/admin/queries";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { DemoBanner } from "@/features/admin/ui/DemoBanner";
import { fmtMonthLong, formatBRL } from "@/features/admin/ui/format";
import { KpiCard } from "@/features/admin/ui/KpiCard";
import { PaymentsView } from "@/features/admin/ui/PaymentsView";

export const metadata: Metadata = { title: "Pagamentos" };

const arrow =
  "grid size-11 place-items-center rounded-full border border-line bg-surface text-fg focus-visible:outline-2 focus-visible:outline-primary";

/** Pagamentos do mês (?mes=YYYY-MM): totais, lista filtrável e exportar CSV. */
export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/pagamentos">) {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_payments" });
  const now = new Date();
  const month = parseMonth((await searchParams).mes, now);
  const payments = await getPayments(month, now);
  const got = receivedInMonth(payments);
  const isCurrent = month === monthKey(now);
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <AdminShell title="Pagamentos" subtitle="Tudo o que entrou e saiu no mês" icon="wallet" tint="green">
      {IS_DEMO ? <DemoBanner /> : null}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Mês" className="flex items-center gap-2">
          <Link href={`/admin/pagamentos?mes=${prev}`} aria-label={`Mês anterior, ${fmtMonthLong(prev)}`} className={arrow}>
            <span className="rotate-90"><Icon name="arrowDown" size={18} /></span>
          </Link>
          <h2 className="min-w-44 text-center font-brand text-xl text-primary-text" aria-live="polite">{fmtMonthLong(month)}</h2>
          {isCurrent ? (
            <span aria-hidden="true" className={`${arrow} opacity-40`}>
              <span className="-rotate-90"><Icon name="arrowDown" size={18} /></span>
            </span>
          ) : (
            <Link href={`/admin/pagamentos?mes=${next}`} aria-label={`Próximo mês, ${fmtMonthLong(next)}`} className={arrow}>
              <span className="-rotate-90"><Icon name="arrowDown" size={18} /></span>
            </Link>
          )}
        </nav>
        <a
          href={`/admin/pagamentos/export?mes=${month}`}
          download
          className="btn-glass flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold"
        >
          <Icon name="download" size={18} /> Exportar CSV
        </a>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon="wallet" tint="green" tone="ok" label="Líquido" value={formatBRL(got.netCents)} note={`${got.approvedCount} aprovados`} />
        <KpiCard icon="coins" tint="lavender" tone="brand" label="Bruto" value={formatBRL(got.grossCents)} />
        <KpiCard icon="ticket" tint="gray" label="Taxas" value={formatBRL(got.feeCents)} note="Mercado Pago" />
        <KpiCard
          icon="refresh"
          tint="red"
          tone={got.refundedCents > 0 ? "fail" : "fg"}
          label="Estornos"
          value={formatBRL(got.refundedCents)}
          note={got.refundedCents ? "estorno ou contestação" : "nenhum"}
          alert={got.refundedCents > 0}
        />
      </div>

      <PaymentsView payments={payments} />
    </AdminShell>
  );
}
