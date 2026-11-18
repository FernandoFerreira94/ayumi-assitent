"use client";

import { useSyncExternalStore } from "react";

const KEY = "bubbly:painel-visao";
const EVENT = "bubbly:painel-visao";
type View = "day" | "week";

/** Sem armazenamento (aba privada): a escolha vale só até fechar. */
const memory: { view: View | null } = { view: null };
function read(): View {
  try {
    return localStorage.getItem(KEY) === "week" ? "week" : "day";
  } catch {
    return memory.view ?? "day";
  }
}
function choose(v: View) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    memory.view = v;
  }
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/**
 * Dia/Semana da agenda no Painel (só tablet e desktop; no celular fica sempre o dia).
 * A escolha fica lembrada no aparelho. Os dois lados já vêm prontos do servidor: trocar é instantâneo.
 */
export function AgendaTabs({ day, week }: { day: React.ReactNode; week: React.ReactNode }) {
  const view = useSyncExternalStore(subscribe, read, () => "day" as View);
  const tab = (v: View, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === v}
      onClick={() => choose(v)}
      className={`min-h-9 rounded-[10px] px-4 text-sm font-bold transition-colors ${
        view === v ? "bg-surface text-primary-text shadow-sm" : "text-muted"
      }`}
    >
      {label}
    </button>
  );
  return (
    <>
      <div className="mb-3 hidden items-center md:flex">
        <div role="tablist" aria-label="Ver a agenda por" className="ml-auto inline-flex rounded-xl bg-[var(--page)] p-1">
          {tab("day", "Dia")}
          {tab("week", "Semana")}
        </div>
      </div>
      {/* No celular o dia aparece sempre; no tablet/desktop, o que estiver escolhido */}
      <div className={view === "week" ? "md:hidden" : undefined}>{day}</div>
      {view === "week" ? <div className="hidden md:block">{week}</div> : null}
    </>
  );
}
