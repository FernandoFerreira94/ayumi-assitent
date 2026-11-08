"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { saveWorkingHours } from "./actions";
import type { Day } from "./slots";

const NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TIMES = Array.from({ length: 33 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});
const sel = "min-h-11 rounded-full border px-3 text-sm font-semibold";

export function HoursForm({ week }: { week: Day[] }) {
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveWorkingHours(prev, fd);
    if (res.ok) notify.success("Expediente salvo");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const badDay = state && !state.ok && state.code === "VALIDATION" ? Number(state.field) : null;

  return (
    <form action={action} className="glass grid gap-3 rounded-[1.75rem] p-5">
      <h2 className="font-bold">Expediente</h2>
      {NAMES.map((name, i) => {
        const d = week[i];
        return (
          <div key={name} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
            <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
              <input type="checkbox" name={`open-${i}`} defaultChecked={!!d} className="check-round" />
              {name}
            </label>
            <select name={`opens-${i}`} aria-label={`${name}: abre`} defaultValue={d?.opens ?? "09:00"} className={sel}>
              {TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              name={`closes-${i}`}
              aria-label={`${name}: fecha`}
              defaultValue={d?.closes ?? "18:00"}
              className={sel}
            >
              {TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            {badDay === i ? (
              <p role="alert" className="col-span-3 text-xs font-semibold text-primary-text">
                {name}: o fechamento precisa ser depois da abertura.
              </p>
            ) : null}
          </div>
        );
      })}
      <SubmitButton pendingLabel="Salvando…">Salvar expediente</SubmitButton>
    </form>
  );
}
