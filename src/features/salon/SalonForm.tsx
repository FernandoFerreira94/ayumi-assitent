"use client";

import { useActionState, useState } from "react";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { saveSalon } from "./actions";
import { maskPhone } from "@/lib/phone";
import { SEGMENTS, type Segment } from "./schema";

const input = "min-h-13 w-full min-w-0 rounded-full border px-5 text-base font-semibold";

/** Meu perfil: quem é a pessoa, o salão (nome e telefone comercial) e os segmentos em que atua. */
export function SalonForm({
  initial,
}: {
  initial: {
    name: string;
    ownerName: string;
    /** Já mascarado; vazio = sem telefone */
    businessPhone: string;
    /** O telefone veio do WhatsApp conectado (ainda não salvo) */
    phoneFromWhatsapp: boolean;
    segments: Segment[];
  };
}) {
  const [phone, setPhone] = useState(initial.businessPhone);
  const [picked, setPicked] = useState<Set<Segment>>(new Set(initial.segments));
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveSalon(prev, fd);
    if (res.ok) notify.success("Perfil atualizado");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const field = state && !state.ok ? state.field : undefined;

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
        <label className="grid gap-1 text-sm font-bold">
          Telefone comercial
          <input
            name="businessPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(11) 98765-4321"
            className={input}
            aria-invalid={field === "businessPhone"}
            aria-describedby="phone-hint"
          />
          {field === "businessPhone" ? (
            <span role="alert" className="text-xs font-semibold text-primary-text">
              Confira o telefone com DDD
            </span>
          ) : (
            <span id="phone-hint" className="text-xs font-semibold text-muted">
              {initial.phoneFromWhatsapp && phone === initial.businessPhone
                ? "Puxamos do seu WhatsApp conectado. Pode trocar se o comercial for outro."
                : "O número que suas clientes usam para falar com o salão."}
            </span>
          )}
        </label>
        <div className="grid gap-1 text-sm font-bold">
          <span id="seg-label">Segmentos (marque quantos fizerem sentido)</span>
          <MultiSelect
            name="segments"
            label="Segmentos"
            options={SEGMENTS}
            value={picked}
            onChange={setPicked}
            placeholder="Escolha seus segmentos"
            invalid={field === "segments"}
          />
          {field === "segments" ? (
            <span role="alert" className="text-xs font-semibold text-primary-text">
              Marque pelo menos um segmento
            </span>
          ) : null}
        </div>
      </section>
      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
