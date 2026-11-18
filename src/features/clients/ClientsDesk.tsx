"use client";

import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useMediaQuery } from "@/lib/use-media";
import { ClientCardContent, DeleteSheet, EditSheet, useClientCard, type Client } from "./ClientRow";
import { CLIENT_FILTERS, type ClientFilter } from "./filters";

/** Desktop (lg do Tailwind): a ficha fica aberta ao lado da lista em vez de abrir em folha. */
export const DESK_QUERY = "(min-width: 64rem)";
export const useIsDesk = () => useMediaQuery(DESK_QUERY);

type Selection = { selectedId: string | null; select: (id: string | null) => void };
const SelectionCtx = createContext<Selection | null>(null);

/** Para a linha da cliente: no desktop, tocar no nome escolhe a cliente (a ficha abre ao lado). */
export function useClientSelection(): Selection | null {
  const ctx = useContext(SelectionCtx);
  const desk = useIsDesk();
  return desk ? ctx : null;
}

/**
 * Clientes no desktop: guarda quem está escolhida e mostra a ficha ao lado da lista.
 * `clients` vem do servidor a cada atualização: editar o nome já aparece no painel.
 */
export function ClientsDesk({
  clients,
  summary,
  children,
}: {
  clients: Client[];
  summary: { total: number; gone: number; fresh: number; due: number };
  children: React.ReactNode;
}) {
  const [selectedId, select] = useState<string | null>(null);
  const selected = clients.find((c) => c.id === selectedId) ?? null;
  return (
    <SelectionCtx.Provider value={{ selectedId, select }}>
      <div className="lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="min-w-0">{children}</div>
        <aside aria-label="Ficha da cliente" className="hidden lg:sticky lg:top-6 lg:block">
          {selected ? (
            <ClientPanel key={selected.id} client={selected} onGone={() => select(null)} />
          ) : (
            <Overview summary={summary} />
          )}
        </aside>
      </div>
    </SelectionCtx.Provider>
  );
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

function ClientPanel({ client, onGone }: { client: Client; onGone: () => void }) {
  const card = useClientCard(client.id, true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <section aria-label={`Ficha de ${client.name}`} className="glass rounded-[1.75rem] px-6 py-5">
      <header className="mb-4 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-soft text-lg font-bold text-primary-text"
        >
          {initials(client.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{client.name}</h2>
          <p className="truncate text-sm font-semibold text-muted">
            {client.phone}
            {client.email ? ` · ${client.email}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onGone}
          aria-label="Fechar a ficha"
          className="grid size-11 place-items-center rounded-full text-muted hover:bg-soft"
        >
          <Icon name="close" size={20} />
        </button>
      </header>
      <ClientCardContent
        client={client}
        card={card}
        nested={false}
        onLeave={() => {}}
        onEdit={() => setEditing(true)}
        onDelete={() => setDeleting(true)}
      />
      <EditSheet client={client} open={editing} onOpenChange={setEditing} />
      <DeleteSheet
        client={client}
        open={deleting}
        // Excluída: some da lista no refresh e o painel volta para o resumo sozinho
        onOpenChange={setDeleting}
      />
    </section>
  );
}

/** Painel sem ninguém escolhida: o resumo da carteira e os atalhos dos filtros. */
function Overview({ summary }: { summary: { total: number; gone: number; fresh: number; due: number } }) {
  const tile = "glass flex flex-col gap-1 rounded-2xl px-4 py-3";
  const link = (f: ClientFilter, n: number, hint: string) => (
    <Link href={`/clientes?f=${f}`} scroll={false} className={`${tile} transition-shadow hover:shadow-md`}>
      <span className="text-2xl font-bold tabular-nums">{n}</span>
      <span className="text-sm font-bold">{CLIENT_FILTERS[f]}</span>
      <span className="text-xs font-semibold text-muted">{hint}</span>
    </Link>
  );
  return (
    <section aria-label="Resumo das clientes" className="glass rounded-[1.75rem] px-6 py-5">
      <h2 className="text-lg font-bold">Sua carteira</h2>
      <p className="pb-4 text-sm font-semibold text-muted">Clique numa cliente para ver a ficha aqui do lado.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className={tile}>
          <span className="text-2xl font-bold tabular-nums">{summary.total}</span>
          <span className="text-sm font-bold">Clientes</span>
          <span className="text-xs font-semibold text-muted">{summary.due} para chamar de volta</span>
        </div>
        {link("sumidas", summary.gone, "Há 60 dias ou mais sem vir")}
        {link("novas", summary.fresh, "Cadastradas nos últimos 30 dias")}
        <Link href="/clientes?f=fieis" scroll={false} className={`${tile} transition-shadow hover:shadow-md`}>
          <Icon name="sparkles" size={22} className="text-primary-text" />
          <span className="text-sm font-bold">Mais fiéis</span>
          <span className="text-xs font-semibold text-muted">Quem mais volta</span>
        </Link>
      </div>
    </section>
  );
}

/** Abas de filtro acima da lista (só desktop). */
export function ClientFilters({ active }: { active: ClientFilter | null }) {
  const chip = (href: string, label: string, on: boolean) => (
    <Link
      key={href}
      href={href}
      scroll={false}
      aria-current={on ? "page" : undefined}
      className={`min-h-9 rounded-full px-4 py-1.5 text-sm font-bold ${on ? "bg-primary text-on-primary" : "bg-soft text-primary-text"}`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Filtrar clientes" className="mb-3 hidden flex-wrap gap-2 lg:flex">
      {chip("/clientes", "Todas", active === null)}
      {(Object.keys(CLIENT_FILTERS) as ClientFilter[]).map((f) =>
        chip(`/clientes?f=${f}`, CLIENT_FILTERS[f], active === f),
      )}
    </nav>
  );
}
