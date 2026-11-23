"use client";

import { useState, type ReactNode } from "react";

const tab =
  "min-h-11 flex-1 rounded-full px-2 text-sm font-bold text-muted transition-colors aria-selected:bg-surface aria-selected:text-primary-text aria-selected:shadow-sm md:text-base";

export type PlansTab = "clientes" | "pacotes" | "promocoes";
const TABS: { id: PlansTab; label: string }[] = [
  { id: "clientes", label: "Clientes" },
  { id: "pacotes", label: "Pacotes" },
  { id: "promocoes", label: "Promoções" },
];

/** Página Planos em três abas (?aba=pacotes|promocoes abre direto). Troca sem recarregar e guarda na URL. */
export function PlansTabs({ initial, panels }: { initial: PlansTab; panels: Record<PlansTab, ReactNode> }) {
  const [view, setView] = useState<PlansTab>(initial);
  function pick(id: PlansTab) {
    setView(id);
    // Voltar/recarregar mantém a aba, sem navegação
    const url = new URL(window.location.href);
    if (id === "clientes") url.searchParams.delete("aba");
    else url.searchParams.set("aba", id);
    window.history.replaceState(window.history.state, "", url);
  }
  return (
    <>
      <div role="tablist" aria-label="Planos" className="glass mb-3 flex gap-1 rounded-full p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-controls={`painel-${t.id}`}
            aria-selected={view === t.id}
            onClick={() => pick(t.id)}
            className={tab}
          >
            {t.label}
          </button>
        ))}
      </div>
      {TABS.map((t) => (
        <div key={t.id} role="tabpanel" id={`painel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={view !== t.id}>
          {panels[t.id]}
        </div>
      ))}
    </>
  );
}
