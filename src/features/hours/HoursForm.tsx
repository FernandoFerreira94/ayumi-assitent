"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { saveWorkingHours } from "./actions";
import type { Day } from "./slots";
import { TileTitle } from "@/components/ui/Icon";

const NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TIMES = Array.from({ length: 33 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});
// 16px: abaixo disso o iPhone dá zoom na tela ao tocar no campo
const sel = "min-h-11 rounded-full border px-3 text-base font-semibold";

export function HoursForm({ week }: { week: Day[] }) {
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveWorkingHours(prev, fd);
    if (res.ok) notify.success("Expediente salvo");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const badDay = state && !state.ok && state.code === "VALIDATION" ? Number(state.field) : null;
  const badBreak = state && !state.ok && state.code === "VALIDATION" && state.field === "break";
  const saved = week.find((d) => d?.breakStart && d.breakEnd);
  const [pauseOn, setPauseOn] = useState(Boolean(saved));

  return (
    <form action={action} className="glass grid gap-3 rounded-[1.75rem] p-5">
      <TileTitle as="h2" icon="clock" tint="teal">
        Expediente
      </TileTitle>
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
      <div className="grid gap-2 border-t border-line pt-3">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              name="break-on"
              checked={pauseOn}
              onChange={(e) => setPauseOn(e.target.checked)}
              className="check-round"
            />
            Pausa
          </label>
          <select
            name="break-start"
            aria-label="Pausa: começa"
            defaultValue={saved?.breakStart ?? "12:00"}
            disabled={!pauseOn}
            className={`${sel} disabled:opacity-50`}
          >
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            name="break-end"
            aria-label="Pausa: termina"
            defaultValue={saved?.breakEnd ?? "13:00"}
            disabled={!pauseOn}
            className={`${sel} disabled:opacity-50`}
          >
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <p className="text-xs font-semibold text-muted">
          Todo dia aberto. Vagas não oferece esse horário e a agenda mostra a faixa.
        </p>
        {badBreak ? (
          <p role="alert" className="text-xs font-semibold text-primary-text">
            A pausa precisa terminar depois de começar.
          </p>
        ) : null}
      </div>
      <SubmitButton pendingLabel="Salvando…">Salvar expediente</SubmitButton>
    </form>
  );
}
