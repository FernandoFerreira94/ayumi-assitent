"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { DEFAULT_REMINDER, reminderText } from "@/features/reminders/text";
import { saveSalon } from "./actions";
import { BUSINESS_TYPES, type BusinessType } from "./schema";

const input = "min-h-13 w-full rounded-full border px-5 text-base font-semibold";
const CHIPS = [
  ["{nome}", "nome da cliente"],
  ["{servico}", "serviço"],
  ["{dia}", "hoje, amanhã ou a data"],
  ["{hora}", "horário"],
  ["{salao}", "nome do salão"],
] as const;

// Prévia com um horário de exemplo: amanhã às 14:30
const sampleNow = new Date();
const sampleStart = new Date(sampleNow.getTime() + 24 * 3600_000);
sampleStart.setUTCHours(17, 30, 0, 0);

/** Nome, tipo de salão e o texto do lembrete que vai para a cliente na véspera. */
export function SalonForm({
  initial,
}: {
  initial: { name: string; businessType: BusinessType | null; reminderTemplate: string | null };
}) {
  const [template, setTemplate] = useState(initial.reminderTemplate ?? DEFAULT_REMINDER);
  const [name, setName] = useState(initial.name);
  const area = useRef<HTMLTextAreaElement>(null);
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveSalon(prev, fd);
    if (res.ok) notify.success("Salão atualizado");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const field = state && !state.ok ? state.field : undefined;

  // Coloca a {chave} onde o cursor está, como num editor de mensagens
  function insert(token: string) {
    const el = area.current;
    if (!el) return setTemplate((t) => t + token);
    const { selectionStart: s, selectionEnd: e } = el;
    const next = template.slice(0, s) + token + template.slice(e);
    setTemplate(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + token.length, s + token.length);
    });
  }

  return (
    <form action={action} className="glass grid gap-3 rounded-[1.75rem] p-5">
      <h2 className="font-bold">Seu salão</h2>
      <label className="grid gap-1 text-sm font-bold">
        Como se chama o salão
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        Tipo de salão
        <select name="businessType" required defaultValue={initial.businessType ?? ""} className={input} aria-invalid={field === "businessType"}>
          <option value="" disabled>
            Escolha…
          </option>
          {BUSINESS_TYPES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Mensagem de confirmação
        <span className="text-xs font-semibold text-muted">Vai no WhatsApp da cliente na véspera do horário.</span>
        <textarea
          ref={area}
          name="reminderTemplate"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={4}
          maxLength={600}
          className="min-h-28 w-full resize-y rounded-3xl border px-5 py-3 text-base font-semibold leading-6"
          aria-invalid={field === "reminderTemplate"}
        />
      </label>
      <div className="flex flex-wrap gap-1.5" aria-label="Inserir dados do horário">
        {CHIPS.map(([token, hint]) => (
          <button
            key={token}
            type="button"
            onClick={() => insert(token)}
            title={hint}
            aria-label={`Inserir ${hint}`}
            className="min-h-9 rounded-full bg-soft px-3 text-xs font-bold text-primary-text"
          >
            {token}
          </button>
        ))}
        <button type="button" onClick={() => setTemplate(DEFAULT_REMINDER)} className="min-h-9 rounded-full px-3 text-xs font-bold text-muted underline">
          Voltar ao padrão
        </button>
      </div>
      <div className="grid gap-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Como a cliente recebe</p>
        <p className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-chat-out px-4 py-3 text-sm font-semibold leading-5" aria-live="polite">
          {reminderText({ client: "Maria Silva", service: "Alongamento", startsAt: sampleStart }, sampleNow, { template, name })}
        </p>
        <p className="text-xs font-semibold text-muted">As opções 1, 2 e 3 vão sempre no fim: é por elas que o app entende a resposta.</p>
      </div>
      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
