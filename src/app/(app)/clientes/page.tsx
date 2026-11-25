import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { clientStats, countClients, listDueReturns, searchClients } from "@/features/clients/core";
import { ClientCount } from "@/features/clients/ClientCount";
import { ClientFilters, ClientsDesk } from "@/features/clients/ClientsDesk";
import {
  applyClientFilter,
  CLIENT_FILTERS,
  daysSince,
  GONE_DAYS,
  isClientFilter,
  NEW_DAYS,
  statsLine,
  type Stats,
} from "@/features/clients/filters";
import { DueReturns, type DueReturn } from "@/features/returns/DueReturns";
import { daysBetween } from "@/features/returns/rules";
import { addDays, formatShortDate, todayStr } from "@/lib/dates";
import { ImportSheet } from "@/features/contacts/ImportSheet";
import { NewClientSheet } from "@/features/clients/NewClientSheet";
import { ClientRow } from "@/features/clients/ClientRow";
import { ClientSearch } from "@/features/clients/ClientSearch";
import { groupByLetter } from "@/lib/groupByLetter";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: PageProps<"/clientes">) {
  await connection(); // filtros e "há N dias" dependem do relógio
  const { q: raw, f: rawFilter } = await searchParams;
  const q = typeof raw === "string" ? raw : "";
  const filter = !q && isClientFilter(rawFilter) ? rawFilter : null;
  const now = new Date();
  const { tenantId } = await requireTenant();
  const today = todayStr();
  const { all, total, due, statRows } = await withTenant(tenantId, async (tx) => ({
    all: await searchClients(tx, q),
    total: await countClients(tx),
    statRows: await clientStats(tx, now),
    // na busca, só a lista: "Para chamar" é para quem abre Clientes sem procurar ninguém
    due: q ? [] : await listDueReturns(tx, addDays(today, -30), addDays(today, 7)),
  }));
  const stats = new Map<string, Stats>(statRows.map((r) => [r.clientId, r]));
  const list = filter ? applyClientFilter(all, stats, filter, now) : all;
  const view = (c: (typeof all)[number]) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: maskPhone(c.phoneE164.replace(/^\+55/, "")),
    optedOut: !!c.optedOutAt,
  });
  const summary = {
    total,
    gone: q ? 0 : applyClientFilter(all, stats, "sumidas", now).length,
    fresh: all.filter((c) => daysSince(c.createdAt, now) <= NEW_DAYS).length,
    due: due.length,
  };
  const dueItems: DueReturn[] = due.map((r) => ({
    appointmentId: r.appointmentId,
    clientId: r.clientId,
    name: r.name,
    phone: maskPhone(r.phoneE164.replace(/^\+55/, "")),
    service: r.service,
    dayLabel: formatShortDate(r.due!),
    lateDays: daysBetween(r.due!, today),
  }));

  return (
    <PageShell wide title="Clientes">
      <ClientsDesk clients={all.map(view)} summary={summary}>
        <ClientCount total={total} shown={q || filter || list.length < total ? list.length : null} />
        <ClientSearch initial={q} />
        <div className="grid grid-cols-2 gap-2 pb-3">
          <ImportSheet />
          <NewClientSheet />
        </div>
        {q ? null : <ClientFilters active={filter} />}
        {filter ? null : <DueReturns items={dueItems} />}
        {list.length === 0 ? (
          filter ? (
            <EmptyState
              icon="users"
              title={`Nenhuma cliente em "${CLIENT_FILTERS[filter]}"`}
              description={
                filter === "sumidas"
                  ? `Ninguém está há ${GONE_DAYS} dias ou mais sem vir. Ótimo sinal!`
                  : "Quando houver, elas aparecem aqui."
              }
            />
          ) : q ? (
            <EmptyState
              icon="search"
              title="Ninguém encontrada"
              description="Confira o nome ou o telefone e tente de novo."
            />
          ) : (
            <EmptyState
              icon="users"
              title="Nenhuma cliente ainda"
              description="Cadastre a primeira cliente para começar a agendar."
            />
          )
        ) : filter ? (
          <ul className="grid gap-2">
            {list.map((c) => (
              <ClientRow key={c.id} client={view(c)} meta={statsLine(stats.get(c.id), now)} />
            ))}
          </ul>
        ) : (
          // Como os Contatos do iPhone: uma seção por letra, com o rótulo fixo no topo enquanto rola
          <div className="grid gap-3">
            {groupByLetter(list.map((c) => ({ label: c.name, c }))).map((g) => (
              <section key={g.letter} aria-labelledby={`letra-${g.letter === "#" ? "outros" : g.letter}`}>
                <h2
                  id={`letra-${g.letter === "#" ? "outros" : g.letter}`}
                  className="sticky top-[max(env(safe-area-inset-top),6px)] z-10 -mx-1 mb-1.5 rounded-full bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-3 py-1 text-sm font-bold text-primary-text backdrop-blur-md"
                >
                  {g.letter}
                </h2>
                <ul className="grid gap-2">
                  {g.items.map(({ c }) => (
                    <ClientRow key={c.id} client={view(c)} meta={statsLine(stats.get(c.id), now)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </ClientsDesk>
    </PageShell>
  );
}
