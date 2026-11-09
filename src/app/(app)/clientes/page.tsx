import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { searchClients } from "@/features/clients/core";
import { ImportSheet } from "@/features/contacts/ImportSheet";
import { NewClientSheet } from "@/features/clients/NewClientSheet";
import { ClientRow } from "@/features/clients/ClientRow";
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
      <form role="search" className="pb-2">
        <input
          name="q"
          defaultValue={q}
          type="search"
          aria-label="Buscar cliente"
          placeholder="Buscar por nome ou telefone"
          className="min-h-12 w-full rounded-full border px-4 text-base font-semibold"
        />
      </form>
      <div className="grid grid-cols-2 gap-2 pb-3">
        <ImportSheet />
        <NewClientSheet />
      </div>
      {list.length === 0 ? (
        q ? (
          <EmptyState title="Ninguém encontrada" description="Confira o nome ou o telefone e tente de novo." />
        ) : (
          <EmptyState title="Nenhuma cliente ainda" description="Cadastre a primeira cliente para começar a agendar." />
        )
      ) : (
        <ul className="grid gap-2">
          {list.map((c) => (
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
      )}
    </PageShell>
  );
}
