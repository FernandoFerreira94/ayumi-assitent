"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { saveSalon } from "./actions";
import { ageFrom, SEGMENTS, type Segment } from "./schema";

const input = "min-h-13 w-full min-w-0 rounded-full border px-5 text-base font-semibold";

/** Meu perfil: quem é a pessoa, o salão e os segmentos em que atua. */
export function SalonForm({
  initial,
}: {
  initial: {
    name: string;
    ownerName: string;
    birthDate: string;
    profession: string;
    segments: Segment[];
  };
}) {
  const [birth, setBirth] = useState(initial.birthDate);
  const [picked, setPicked] = useState<Set<Segment>>(new Set(initial.segments));
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveSalon(prev, fd);
    if (res.ok) notify.success("Perfil atualizado");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const field = state && !state.ok ? state.field : undefined;
  const age = birth ? ageFrom(birth) : null;

  const toggle = (id: Segment) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <form action={action} className="grid gap-6">
      <section aria-label="Você" className="glass grid gap-3 rounded-[1.75rem] p-5">
        <h2 className="font-bold">Você</h2>
        <label className="grid gap-1 text-sm font-bold">
          Seu nome
          <input
            name="ownerName"
            defaultValue={initial.ownerName}
            autoComplete="name"
            placeholder="Ex.: Yumi Tanaka"
            className={input}
            aria-invalid={field === "ownerName"}
          />
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-end gap-3">
          <label className="grid min-w-0 gap-1 text-sm font-bold">
            Data de nascimento
            <input
              name="birthDate"
              type="date"
              value={birth}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBirth(e.target.value)}
              className={input}
              aria-invalid={field === "birthDate"}
            />
          </label>
          <p className="grid gap-1 text-sm font-bold">
            Idade
            <output
              aria-live="polite"
              className="grid min-h-13 place-items-center rounded-full bg-soft px-3 text-base font-bold text-primary-text"
            >
              {age === null ? "—" : `${age} anos`}
            </output>
          </p>
        </div>
        {field === "birthDate" ? (
          <span role="alert" className="text-xs font-semibold text-primary-text">
            Confira a data de nascimento
          </span>
        ) : null}
        <label className="grid gap-1 text-sm font-bold">
          Profissão
          <input
            name="profession"
            defaultValue={initial.profession}
            placeholder="Ex.: Nail designer, cabeleireira"
            className={input}
            aria-invalid={field === "profession"}
          />
        </label>
      </section>

      <section aria-label="Seu salão" className="glass grid gap-3 rounded-[1.75rem] p-5">
        <h2 className="font-bold">Seu salão</h2>
        <label className="grid gap-1 text-sm font-bold">
          Nome do salão
          <input
            name="name"
            required
            defaultValue={initial.name}
            placeholder="Ex.: Studio Yumi"
            className={input}
            aria-invalid={field === "name"}
          />
          {field === "name" ? (
            <span role="alert" className="text-xs text-primary-text">
              Dê um nome ao salão
            </span>
          ) : null}
        </label>
        <fieldset className="grid gap-2">
          <legend className="pb-1 text-sm font-bold">Segmentos (marque quantos fizerem sentido)</legend>
          <div className="flex flex-wrap gap-2">
            {SEGMENTS.map(([id, label]) => (
              <label key={id} className="relative">
                <input
                  type="checkbox"
                  name="segments"
                  value={id}
                  checked={picked.has(id)}
                  onChange={() => toggle(id)}
                  className="peer sr-only"
                />
                <span className="flex min-h-10 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-bold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                  {label}
                </span>
              </label>
            ))}
          </div>
          {field === "segments" ? (
            <span role="alert" className="text-xs font-semibold text-primary-text">
              Marque pelo menos um segmento
            </span>
          ) : null}
        </fieldset>
      </section>
      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
