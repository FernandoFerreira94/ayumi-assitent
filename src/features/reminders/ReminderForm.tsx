"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { Switch } from "@/components/ui/Switch";
import type { ActionResult } from "@/lib/errors";
import { saveReminderSettings } from "./actions";
import type { ReminderSettings } from "./core";

const hoursInput = "min-h-11 w-20 rounded-xl border border-line px-3 text-center text-base font-bold tabular-nums";

/**
 * O que o Mimo manda pelo WhatsApp: mensagem de agendamento confirmado (valor opcional), 1º aviso para a
 * cliente confirmar o horário e, se a profissional quiser, um 2º aviso. Ela escolhe quantas horas antes.
 */
export function ReminderForm({ settings }: { settings: ReminderSettings }) {
  const [includePrice, setIncludePrice] = useState(settings.includePrice);
  const [second, setSecond] = useState(settings.secondHours !== null);
  const [hours, setHours] = useState(String(settings.hours));
  const [secondHours, setSecondHours] = useState(String(settings.secondHours ?? 3));
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveReminderSettings(prev, fd);
    if (res.ok) notify.success("Avisos salvos");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const err = state && !state.ok && state.code === "VALIDATION" ? state.field : undefined;

  return (
    <form action={action} className="glass grid gap-4 rounded-[1.75rem] px-5 py-4">
      <div>
        <h2 className="font-bold">Mensagens no WhatsApp</h2>
        <p className="text-sm font-semibold text-muted">
          O Mimo só manda a confirmação do agendamento e os avisos para a cliente confirmar o horário. Cancelar ou
          remarcar fica com você.
        </p>
      </div>
      <input type="hidden" name="includePrice" value={includePrice ? "1" : ""} />
      <input type="hidden" name="second" value={second ? "1" : ""} />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">Valor na confirmação</p>
          <p className="text-sm font-semibold text-muted">Mostra o preço do serviço na mensagem de agendamento.</p>
        </div>
        <Switch checked={includePrice} onChange={setIncludePrice} label="Incluir o valor na mensagem de agendamento" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label htmlFor="rem-hours" className="min-w-0">
          <span className="block font-bold">1º aviso</span>
          <span className="block text-sm font-semibold text-muted">Horas antes do horário</span>
        </label>
        <input
          id="rem-hours"
          name="hours"
          type="number"
          inputMode="numeric"
          min={1}
          max={72}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          aria-invalid={err === "hours"}
          className={hoursInput}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">2º aviso</p>
          <p className="text-sm font-semibold text-muted">Só para quem não respondeu ao primeiro.</p>
        </div>
        <Switch checked={second} onChange={setSecond} label="Enviar um segundo aviso" />
      </div>
      {second ? (
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="rem-second" className="min-w-0 font-bold">
            Horas antes do horário
          </label>
          <input
            id="rem-second"
            name="secondHours"
            type="number"
            inputMode="numeric"
            min={1}
            max={72}
            value={secondHours}
            onChange={(e) => setSecondHours(e.target.value)}
            aria-invalid={err === "secondHours"}
            className={hoursInput}
          />
        </div>
      ) : null}

      {err ? (
        <p role="alert" className="text-sm font-semibold text-fail">
          {err === "secondHours"
            ? "O 2º aviso precisa ser mais perto do horário que o 1º (menos horas, entre 1 e 72)."
            : "Escolha entre 1 e 72 horas."}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Salvando…">Salvar avisos</SubmitButton>
    </form>
  );
}
