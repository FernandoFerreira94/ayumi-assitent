import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listDay } from "@/features/appointments/core";
import { ExpenseList } from "@/features/finance/ExpenseList";
import { expenseSlices, listExpenses } from "@/features/finance/expenses";
import { NewExpenseSheet } from "@/features/finance/NewExpenseSheet";
import { isMonth, monthRange, shiftMonth } from "@/features/finance/period";
import { ServicePie } from "@/features/finance/ServicePie";
import { summarize } from "@/features/finance/summary";
import { formatBRL, todayStr } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Financeiro" };

const card = "glass grid gap-3 rounded-[1.75rem] px-5 py-4";
const h2 = "text-sm font-bold uppercase tracking-wide text-muted";

const Chevron = ({ dir }: { dir: "l" | "r" }) => (
  <svg
    viewBox="0 0 24 24"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={dir === "l" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
);

export default async function FinanceiroPage({ searchParams }: PageProps<"/financeiro">) {
  await connection(); // o mês padrão depende de hoje
  const { m } = await searchParams;
  const today = todayStr();
  const ym = isMonth(m) ? m : today.slice(0, 7);
  const { range, dates, label } = monthRange(ym);
  const { tenantId } = await requireTenant();
  const { rows, spent } = await withTenant(tenantId, async (tx) => ({
    rows: await listDay(tx, range),
    spent: await listExpenses(tx, dates[0], dates[1]),
  }));
  const s = summarize(rows);
  const spentCents = spent.reduce((t, e) => t + e.amountCents, 0);
  const balance = s.received - spentCents;
  const sheetDate = ym === today.slice(0, 7) ? today : dates[0];

  return (
    <PageShell title="Financeiro" subtitle={label}>
      <nav aria-label="Mês" className={`${card} mb-4 grid-cols-[auto_1fr_auto] items-center py-2`}>
        <Link
          href={`/financeiro?m=${shiftMonth(ym, -1)}`}
          scroll={false}
          aria-label="Mês anterior"
          className="btn-glass grid size-11 place-items-center rounded-full"
        >
          <Chevron dir="l" />
        </Link>
        <p className="text-center font-bold">{label}</p>
        <Link
          href={`/financeiro?m=${shiftMonth(ym, 1)}`}
          scroll={false}
          aria-label="Próximo mês"
          className="btn-glass grid size-11 place-items-center rounded-full"
        >
          <Chevron dir="r" />
        </Link>
      </nav>

      <div className="grid gap-4">
        <section aria-label="Resumo" className={card}>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              <Icon name="wallet" size={16} className="text-primary-text" />
              Saldo do mês
            </p>
            <p className={`text-3xl font-bold tabular-nums ${balance < 0 ? "text-fail" : ""}`}>{formatBRL(balance)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold text-muted">
                <Icon name="arrowUp" size={14} className="text-ok" />
                Ganhos
              </dt>
              <dd className="font-bold tabular-nums">{formatBRL(s.received)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold text-muted">
                <Icon name="arrowDown" size={14} className="text-fail" />
                Gastos
              </dt>
              <dd className="font-bold tabular-nums">{formatBRL(spentCents)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold text-muted">
                <Icon name="forecast" size={14} className="text-primary-text" />
                Previsto
              </dt>
              <dd className="font-bold tabular-nums">{formatBRL(s.forecast)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold text-muted">
                <Icon name="ticket" size={14} className="text-primary-text" />
                Ticket médio
              </dt>
              <dd className="font-bold tabular-nums">{formatBRL(s.averageCents)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="por-servico" className={card}>
          <h2 id="por-servico" className={h2}>
            {s.received > 0 || s.forecast === 0 ? "Ganhos por serviço" : "Previsto por serviço"}
          </h2>
          {s.received > 0 ? (
            <ServicePie slices={s.slices} total={s.received} label="recebido" />
          ) : s.forecast > 0 ? (
            <>
              <ServicePie slices={s.forecastSlices} total={s.forecast} label="previsto" />
              <p className="text-center text-xs font-semibold text-muted">
                Ainda não há atendimento concluído. Mostrando o que está agendado no mês.
              </p>
            </>
          ) : (
            <EmptyState
              icon="coins"
              title="Nada recebido nesse mês"
              description="O ganho conta os atendimentos marcados como concluídos na agenda."
            />
          )}
        </section>

        <section aria-labelledby="por-categoria" className={card}>
          <h2 id="por-categoria" className={h2}>
            Gastos por categoria
          </h2>
          {spentCents === 0 ? (
            <p className="py-4 text-center text-sm font-semibold text-muted">Nenhum gasto lançado nesse mês.</p>
          ) : (
            <ServicePie slices={expenseSlices(spent)} total={spentCents} label="gasto" palette="expense" />
          )}
        </section>

        <section aria-labelledby="lancamentos" className={card}>
          <h2 id="lancamentos" className={h2}>
            Gastos lançados
          </h2>
          {spent.length ? <ExpenseList rows={spent} /> : null}
          <NewExpenseSheet date={sheetDate} />
        </section>
      </div>
    </PageShell>
  );
}
