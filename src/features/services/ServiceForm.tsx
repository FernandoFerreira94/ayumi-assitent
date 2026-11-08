"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { maskMoney } from "@/lib/money";
import { createService, editService } from "./actions";

const input = "min-h-13 w-full rounded-full border px-5 text-base font-semibold";

export type ServiceRow = { id: string; name: string; durationMin: number; priceCents: number };

/** Com `service`, edita esse serviço; sem, cadastra um novo e limpa os campos para o próximo. */
export function ServiceForm({ service, onSaved }: { service?: ServiceRow; onSaved?: () => void }) {
  const ref = useRef<HTMLFormElement>(null);
  const [price, setPrice] = useState(service ? maskMoney(String(service.priceCents)) : "");
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await (service ? editService : createService)(prev, fd);
    if (res.ok) {
      notify.success(service ? "Serviço atualizado" : "Serviço adicionado");
      if (!service) {
        ref.current?.reset();
        setPrice("");
      }
      onSaved?.();
    } else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const field = state && !state.ok ? state.field : undefined;
  const bad = (f: string) => (field === f ? "Confira este campo" : null);

  return (
    <form ref={ref} action={action} className="grid gap-3">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <label className="grid gap-1 text-sm font-bold">
        Nome
        <input
          name="name"
          required
          autoComplete="off"
          placeholder="Ex.: Design de sobrancelha"
          defaultValue={service?.name}
          className={input}
          aria-invalid={field === "name"}
        />
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
            defaultValue={service?.durationMin ?? 60}
            placeholder="Ex.: 60"
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
            inputMode="numeric"
            required
            placeholder="0,00"
            value={price}
            onChange={(e) => setPrice(maskMoney(e.target.value))}
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
      <SubmitButton pendingLabel="Salvando…">Salvar serviço</SubmitButton>
    </form>
  );
}
