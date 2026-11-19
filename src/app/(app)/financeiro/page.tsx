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
import { byMonth, monthsUpTo, noShows, topClients } from "@/features/finance/insights";
import { MonthlyBars } from "@/features/finance/MonthlyBars";
import { PaymentList } from "@/features/finance/PaymentList";
import { splitPayments } from "@/features/finance/payments";
import { cashInRange } from "@/features/wallet/core";
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
  // Tablet/desktop: os 6 meses até o escolhido (uma consulta para o período todo)
  const months = monthsUpTo(ym, 6);
  const first = monthRange(months[0]);
  const { rows, spent, history, historySpent, cash } = await withTenant(tenantId, async (tx) => ({
    rows: await listDay(tx, range),
    cash: await cashInRange(tx, range),
    spent: await listExpenses(tx, dates[0], dates[1]),
    history: await listDay(tx, [first.range[0], range[1]]),
    historySpent: await listExpenses(tx, first.dates[0], dates[1]),
  }));
  const points = byMonth(months, history, historySpent);
  const prev = points[points.length - 2];
  const top = topClients(rows);
  const missed = noShows(rows);
  const s = summarize(rows);
  const pay = splitPayments(rows);
  const spentCents = spent.reduce((t, e) => t + e.amountCents, 0);
  const balance = s.received - spentCents;
  const sheetDate = ym === today.slice(0, 7) ? today : dates[0];

  return (
    <PageShell wide title="Financeiro" subtitle={label}>
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

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <section aria-label="Resumo" className={`${card} lg:col-span-2`}>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              <Icon name="wallet" size={16} className="text-primary-text" />
              Saldo do mês
            </p>
            <p className={`text-3xl font-bold tabular-nums ${balance < 0 ? "text-fail" : ""}`}>{formatBRL(balance)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm lg:grid-cols-4">
            <div>
              <dt className="flex items-center gap-1 text-xs font-bold text-muted">
                <Icon name="arrowUp" size={14} className="text-ok" />
                Ganhos
              </dt>
              <dd className="font-bold tabular-nums">{formatBRL(s.received)}</dd>
              {prev ? (
                <dd className="hidden text-xs font-semibold text-muted md:block">
                  mês anterior {formatBRL(prev.received)}
                </dd>
              ) : null}
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
                A receber
              </dt>
              <dd className="font-bold tabular-nums">{formatBRL(s.pending)}</dd>
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

        {/* Logo abaixo do saldo: lançar gasto é a ação principal da tela */}
        <div className="lg:col-span-2">
          <NewExpenseSheet date={sheetDate} />
        </div>

        {/* Coluna da esquerda (tablet/desktop): evolução, quem mais trouxe e faltas */}
        <div className="hidden gap-4 md:grid">
          <section aria-labelledby="seis-meses" className={card}>
            <h2 id="seis-meses" className={h2}>
              Últimos 6 meses
            </h2>
            <MonthlyBars points={points} current={ym} />
          </section>

          <section aria-labelledby="top-clientes" className={card}>
            <h2 id="top-clientes" className={h2}>
              Quem mais trouxe no mês
            </h2>
            {top.length === 0 ? (
              <p className="py-2 text-sm font-semibold text-muted">Nenhum atendimento concluído nesse mês.</p>
            ) : (
              <ol className="divide-y divide-line">
                {top.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-soft text-sm font-bold text-primary-text">
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 truncate font-bold">
                      {c.name}
                      <span className="block text-xs font-semibold text-muted">
                        {c.visits} {c.visits === 1 ? "visita" : "visitas"}
                      </span>
                    </p>
                    <span className="font-bold tabular-nums">{formatBRL(c.cents)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="faltas" className={card}>
            <h2 id="faltas" className={h2}>
              Faltas no mês
            </h2>
            {missed.pct === null ? (
              <p className="py-2 text-sm font-semibold text-muted">Nada aconteceu ainda nesse mês.</p>
            ) : (
              <div className="flex items-end gap-6">
                <p>
                  <span className={`block text-3xl font-bold tabular-nums ${missed.pct >= 10 ? "text-wait" : ""}`}>
                    {missed.pct}%
                  </span>
                  <span className="text-xs font-semibold text-muted">
                    {missed.count} {missed.count === 1 ? "falta" : "faltas"} entre os atendimentos que já passaram
                  </span>
                </p>
                {missed.lostCents > 0 ? (
                  <p className="ml-auto text-right">
                    <span className="block font-bold tabular-nums text-fail">{formatBRL(missed.lostCents)}</span>
                    <span className="text-xs font-semibold text-muted">deixou de entrar</span>
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-4">
          <section aria-labelledby="pagamentos" className={card}>
            <h2 id="pagamentos" className={h2}>
              Pagamentos das clientes
            </h2>
            <PaymentList {...pay} cashCents={cash} />
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

          {spent.length ? (
            <section aria-labelledby="lancamentos" className={card}>
              <h2 id="lancamentos" className={h2}>
                Gastos lançados
              </h2>
              <ExpenseList rows={spent} />
            </section>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
