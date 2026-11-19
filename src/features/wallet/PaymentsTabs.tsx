"use client";

import { useState, type ReactNode } from "react";

const tab =
  "min-h-11 flex-1 rounded-full text-base font-bold text-muted transition-colors aria-selected:bg-surface aria-selected:text-primary-text aria-selected:shadow-sm";

/** Ajustes > Pagamentos em duas abas: Regras (sinal, cancelar, Pix) e Pacotes (?aba=pacotes abre a segunda). */
export function PaymentsTabs({
  rules,
  packages,
  initial = "rules",
}: {
  rules: ReactNode;
  packages: ReactNode;
  initial?: "rules" | "packages";
}) {
  const [view, setView] = useState(initial);
  return (
    <>
      <div role="tablist" aria-label="Pagamentos" className="glass mb-3 flex gap-1 rounded-full p-1">
        <button
          type="button"
          role="tab"
          id="tab-regras"
          aria-controls="painel-regras"
          aria-selected={view === "rules"}
          onClick={() => setView("rules")}
          className={tab}
        >
          Regras
        </button>
        <button
          type="button"
          role="tab"
          id="tab-pacotes"
          aria-controls="painel-pacotes"
          aria-selected={view === "packages"}
          onClick={() => setView("packages")}
          className={tab}
        >
          Pacotes e promoções
        </button>
      </div>
      <div role="tabpanel" id="painel-regras" aria-labelledby="tab-regras" hidden={view !== "rules"}>
        {rules}
      </div>
      <div role="tabpanel" id="painel-pacotes" aria-labelledby="tab-pacotes" hidden={view !== "packages"}>
        {packages}
      </div>
    </>
  );
}
