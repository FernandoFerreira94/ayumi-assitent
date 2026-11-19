"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { canSkip, dotStates, type EntryStep } from "./steps";

/** Os 4 pontinhos de progresso: o da tela atual é alongado, os de trás ficam cheios. */
function Dots({ step }: { step: EntryStep }) {
  const states = dotStates(step);
  const at = states.indexOf("now");
  return (
    <ol className="flex items-center gap-1.5" aria-label={at >= 0 ? `Passo ${at + 1} de 4` : "Passos concluídos"}>
      {states.map((s, i) => (
        <li
          key={i}
          aria-current={s === "now" ? "step" : undefined}
          className={`h-2 rounded-full transition-all ${
            s === "now" ? "w-6 bg-primary" : s === "done" ? "w-2 bg-primary/60" : "w-2 bg-line"
          }`}
        />
      ))}
    </ol>
  );
}

/**
 * Moldura das telas da entrada (mesma da prancha): pontinhos e "Pular" no alto, título, desenho no meio e as
 * ações embaixo. Ao trocar de tela o foco vai para o título, para o leitor de tela anunciar o passo novo.
 */
export function EntryScreen({
  step,
  title,
  text,
  onSkip,
  skipLabel = "Pular",
  children,
  actions,
}: {
  step: EntryStep;
  title: string;
  text?: string;
  onSkip?: () => void;
  skipLabel?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step, title]);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+16px)]">
      <div className="flex h-11 items-center justify-between">
        {step === "done" ? <span /> : <Dots step={step} />}
        {onSkip && canSkip(step) ? (
          <button type="button" onClick={onSkip} className="min-h-11 rounded-full px-4 text-sm font-bold text-muted">
            {skipLabel}
          </button>
        ) : (
          <span />
        )}
      </div>
      <header className="grid gap-2 px-1 pt-4 text-center">
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold leading-tight outline-none">
          {title}
        </h1>
        {text ? <p className="text-[15px] font-semibold leading-snug text-muted">{text}</p> : null}
      </header>
      <div className="grid flex-1 content-center justify-items-center gap-4 py-5">{children}</div>
      <div className="grid gap-2">{actions}</div>
    </main>
  );
}

/** Botão principal (vidro lavanda), largo e redondo como os do app. */
export function PrimaryButton({
  children,
  onClick,
  busy,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      aria-busy={busy}
      className="btn-tint flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-bold disabled:opacity-70"
    >
      {busy ? <span className="spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 rounded-full px-4 text-sm font-bold text-primary-text">
      {children}
    </button>
  );
}

/** Linha de aviso que não trava: diz o que aconteceu e onde ligar depois. */
export function Note({ tone = "soft", children }: { tone?: "soft" | "wait"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={`rounded-[1.25rem] px-4 py-3 text-sm font-semibold leading-snug ${
        tone === "wait" ? "bg-wait-bg text-wait" : "bg-soft text-primary-text"
      }`}
    >
      {children}
    </p>
  );
}

export const Fine = ({ children }: { children: ReactNode }) => (
  <p className="min-h-5 text-center text-xs font-semibold text-muted">{children}</p>
);
