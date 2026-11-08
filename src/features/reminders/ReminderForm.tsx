"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { saveReminderSettings } from "./actions";

const OPTIONS = [2, 4, 12, 24, 48];

export function ReminderForm({ hours }: { hours: number }) {
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveReminderSettings(prev, fd);
    if (res.ok) notify.success("Lembrete salvo");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const options = OPTIONS.includes(hours) ? OPTIONS : [...OPTIONS, hours].sort((a, b) => a - b);

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-line bg-white p-4">
      <h2 className="font-bold">Lembrete por WhatsApp</h2>
      <label className="grid gap-1 text-sm font-bold">
        Enviar com quanta antecedência?
        <select
          name="hours"
          defaultValue={hours}
          className="min-h-11 rounded-xl border border-line bg-white px-2 text-sm font-semibold"
        >
          {options.map((h) => (
            <option key={h} value={h}>
              {h} horas antes
            </option>
          ))}
        </select>
      </label>
      {state && !state.ok && state.code === "VALIDATION" ? (
        <p role="alert" className="text-xs font-semibold text-primary-text">
          Escolha entre 1 e 72 horas.
        </p>
      ) : null}
      <SubmitButton pendingLabel="Salvando…">Salvar lembrete</SubmitButton>
    </form>
  );
}
