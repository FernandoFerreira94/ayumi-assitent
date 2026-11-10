"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { saveAiSettings } from "./actions";
import { AI_RULES_MAX } from "./schema";
import { TileTitle } from "@/components/ui/Icon";

/**
 * A IA responde aos avisos (sempre ligada): confirma sozinha quando a cliente deixa claro que vai, e passa o
 * resto para a profissional. As regras abaixo entram no que a IA lê antes de decidir.
 */
export function AiRepliesForm({ rules }: { rules: string }) {
  const [text, setText] = useState(rules);
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveAiSettings(prev, fd);
    if (res.ok) notify.success("Respostas com IA salvas");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const invalid = state && !state.ok && state.code === "VALIDATION";

  return (
    <form action={action} className="glass grid gap-4 rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <TileTitle as="h2" icon="sparkles" tint="pink">
            Respostas com IA
          </TileTitle>
          <p className="text-sm font-semibold text-muted">
            A IA confirma o horário quando a cliente deixa claro que vai. Cancelar, remarcar e qualquer dúvida passam
            para você, e a cliente recebe um aviso de que você continua a conversa.
          </p>
        </div>
      </div>
      <label className="grid gap-1 text-sm font-bold">
        Regras para a IA
        <span className="text-xs font-semibold text-muted">
          Opcional. Ex.: “Atendo de terça a sábado. Atrasos acima de 15 minutos precisam remarcar.”
        </span>
        <textarea
          name="aiRules"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={AI_RULES_MAX}
          aria-invalid={invalid || undefined}
          className="min-h-28 w-full resize-y rounded-3xl border px-5 py-3 text-base font-semibold leading-6"
        />
        <span className="text-xs font-semibold text-muted tabular-nums">
          {text.length}/{AI_RULES_MAX}
        </span>
      </label>
      {invalid ? (
        <p role="alert" className="text-sm font-semibold text-fail">
          As regras podem ter até {AI_RULES_MAX} caracteres.
        </p>
      ) : null}
      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
