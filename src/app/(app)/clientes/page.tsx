import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { searchClients } from "@/features/clients/core";
import { ImportSheet } from "@/features/contacts/ImportSheet";
import { NewClientSheet } from "@/features/clients/NewClientSheet";
import { ChatGlyph, ChatSheet } from "@/features/messaging/ChatSheet";
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
          {list.map((c) => {
            const phone = maskPhone(c.phoneE164.replace(/^\+55/, ""));
            return (
              <li key={c.id}>
                {/* Tocar na cliente abre a conversa no WhatsApp do salão */}
                <ChatSheet
                  clientId={c.id}
                  clientName={c.name}
                  phone={phone}
                  triggerClassName="glass flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{c.name}</span>
                    <span className="block text-sm font-semibold text-muted">{phone}</span>
                  </span>
                  <ChatGlyph />
                </ChatSheet>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
