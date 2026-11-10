import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { searchClients } from "@/features/clients/core";
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
  const list = await withTenant(tenantId, (tx) => searchClients(tx, q));

  return (
    <PageShell title="Clientes">
      <ClientSearch initial={q} />
      <div className="grid grid-cols-2 gap-2 pb-3">
        <ImportSheet />
        <NewClientSheet />
      </div>
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
