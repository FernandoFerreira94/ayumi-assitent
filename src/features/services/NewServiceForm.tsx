"use client";

import { useActionState, useRef } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { createService } from "./actions";

const input =
  "min-h-13 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold outline-none focus:border-primary";

export function NewServiceForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await createService(prev, fd);
    if (res.ok) {
      notify.success("Serviço adicionado");
      ref.current?.reset();
    } else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const field = state && !state.ok ? state.field : undefined;
  const bad = (f: string) => (field === f ? "Confira este campo" : null);

  return (
    <form ref={ref} action={action} className="grid gap-3 rounded-3xl border border-line bg-white p-4">
      <h2 className="font-bold">Novo serviço</h2>
      <label className="grid gap-1 text-sm font-bold">
        Nome
        <input name="name" required autoComplete="off" className={input} aria-invalid={field === "name"} />
        {bad("name") ? (
          <span role="alert" className="text-xs text-primary-text">
            {bad("name")}
          </span>
        ) : null}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-bold">
          Duração (min)
          <input
            name="durationMin"
            inputMode="numeric"
            required
            defaultValue="60"
            className={input}
            aria-invalid={field === "durationMin"}
          />
          {bad("durationMin") ? (
            <span role="alert" className="text-xs text-primary-text">
              Entre 15 e 480
            </span>
          ) : null}
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Valor (R$)
          <input
            name="price"
            inputMode="decimal"
            required
            placeholder="150,00"
            className={input}
            aria-invalid={field === "price"}
          />
          {bad("price") ? (
            <span role="alert" className="text-xs text-primary-text">
              Valor inválido
            </span>
          ) : null}
        </label>
      </div>
      <SubmitButton pendingLabel="Salvando…">Adicionar serviço</SubmitButton>
    </form>
  );
}
