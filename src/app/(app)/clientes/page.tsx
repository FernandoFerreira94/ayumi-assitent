import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listDueReturns, searchClients } from "@/features/clients/core";
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
  const { q: raw } = await searchParams;
  const q = typeof raw === "string" ? raw : "";
  const { tenantId } = await requireTenant();
  const today = todayStr();
  const { list, due } = await withTenant(tenantId, async (tx) => ({
    list: await searchClients(tx, q),
    // na busca, só a lista: "Para chamar" é para quem abre Clientes sem procurar ninguém
    due: q ? [] : await listDueReturns(tx, addDays(today, -30), addDays(today, 7)),
  }));
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
    <PageShell title="Clientes">
      <ClientSearch initial={q} />
      <div className="grid grid-cols-2 gap-2 pb-3">
        <ImportSheet />
        <NewClientSheet />
      </div>
      <DueReturns items={dueItems} />
      {list.length === 0 ? (
        q ? (
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
                  <ClientRow
                    key={c.id}
                    client={{
                      id: c.id,
                      name: c.name,
                      email: c.email,
                      phone: maskPhone(c.phoneE164.replace(/^\+55/, "")),
                      optedOut: !!c.optedOutAt,
                    }}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
