"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { sendLaunchFeedback, skipLaunchFeedback } from "./actions";
import { FEEDBACK_MAX_LEN, FEEDBACK_QUESTIONS } from "./feedback";

const FIELD = "min-h-12 w-full resize-y rounded-xl border border-line bg-bg px-3 py-2.5 text-base font-semibold";
const SCORES = Array.from({ length: 11 }, (_, i) => i);

/**
 * Feedback do lançamento no Painel (depois de 7 dias de estúdio). Três perguntas, só a nota é obrigatória.
 * "Agora não" some com o cartão na hora e grava; se falhar, ele volta e mostra o erro.
 */
export function FeedbackCard() {
  const [hidden, setHidden] = useState(false);
  const [sent, setSent] = useState(false);
  const [helps, setHelps] = useState("");
  const [missing, setMissing] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [pending, start] = useTransition();
  if (hidden) return null;

  function skip() {
    setHidden(true);
    start(async () => {
      const res = await skipLaunchFeedback().catch(() => null);
      if (!res?.ok) {
        setHidden(false);
        notify.error(res && !res.ok ? res.code : "NETWORK", skip);
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (score === null) return;
    start(async () => {
      const res = await sendLaunchFeedback({ helps, missing, score }).catch(() => null);
      if (res?.ok) setSent(true);
      else notify.error(res && !res.ok ? res.code : "NETWORK");
    });
  }

  if (sent) {
    return (
      <section aria-label="Feedback enviado" aria-live="polite" className="glass rounded-2xl px-4 py-3">
        <h2 className="font-bold leading-tight">Obrigada pelo retorno!</h2>
        <p className="text-sm font-semibold text-muted">A gente lê cada resposta para decidir o que melhorar primeiro.</p>
      </section>
    );
  }

  return (
    <section aria-label="Como está sendo usar o Bubbly" className="glass rounded-2xl py-3 pl-4 pr-1">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-text">Sua opinião</p>
          <h2 className="font-bold leading-tight">Como está sendo usar o Bubbly?</h2>
          <p className="text-sm font-semibold text-muted">Leva menos de um minuto e ajuda a gente a melhorar.</p>
        </div>
        <button
          type="button"
          onClick={skip}
          aria-label="Fechar o cartão de opinião"
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-soft"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <form onSubmit={submit} className="mt-3 grid gap-3 pr-3">
        <label className="grid gap-1 text-sm font-bold">
          {FEEDBACK_QUESTIONS.helps}
          <textarea value={helps} onChange={(e) => setHelps(e.target.value)} maxLength={FEEDBACK_MAX_LEN} rows={2} className={FIELD} />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {FEEDBACK_QUESTIONS.missing}
          <textarea value={missing} onChange={(e) => setMissing(e.target.value)} maxLength={FEEDBACK_MAX_LEN} rows={2} className={FIELD} />
        </label>
        <fieldset className="grid gap-2">
          <legend className="pb-1 text-sm font-bold">{FEEDBACK_QUESTIONS.score}</legend>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
            {SCORES.map((n) => (
              <label
                key={n}
                className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-line text-base font-bold tabular-nums has-[:checked]:border-primary has-[:checked]:bg-soft has-[:checked]:text-primary-text has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
              >
                <input type="radio" name="score" value={n} checked={score === n} onChange={() => setScore(n)} className="sr-only" />
                {n}
              </label>
            ))}
          </div>
          <div className="flex justify-between text-xs font-semibold text-muted" aria-hidden="true">
            <span>Nada provável</span>
            <span>Com certeza</span>
          </div>
        </fieldset>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending || score === null}
            className="btn-tint min-h-12 flex-1 rounded-2xl px-4 font-bold disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Enviar"}
          </button>
          <button type="button" onClick={skip} disabled={pending} className="btn-glass min-h-12 rounded-2xl px-4 font-bold disabled:opacity-60">
            Agora não
          </button>
        </div>
      </form>
    </section>
  );
}
