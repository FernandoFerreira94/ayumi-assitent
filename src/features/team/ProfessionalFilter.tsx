"use client";

import { useOptimistic, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { setAgendaFilter } from "@/features/appointments/actions";
import type { ProfessionalOption } from "./agenda-scope";

/** Filtro "Todas / por profissional" acima da agenda. Só aparece com 2+ profissionais ativas (choices não vazio). */
export function ProfessionalFilter({ choices, active }: { choices: ProfessionalOption[]; active: string | undefined }) {
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(active ?? null);
  if (choices.length === 0) return null;

  const pick = (id: string | null) =>
    start(async () => {
      setShown(id);
      const res = await setAgendaFilter(id);
      if (!res.ok) notify.error(res.code);
    });
  const chip = (id: string | null, label: string) => {
    const on = shown === id;
    return (
      <button
        key={id ?? "todas"}
        type="button"
        aria-pressed={on}
        onClick={() => pick(id)}
        className={`min-h-9 shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${on ? "bg-primary text-on-primary" : "bg-soft text-primary-text"}`}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-label="Agenda de qual profissional"
      aria-busy={pending}
      className="mb-3 flex gap-2 overflow-x-auto pb-1"
    >
      {chip(null, "Todas")}
      {choices.map((p) => chip(p.id, p.label))}
    </div>
  );
}
