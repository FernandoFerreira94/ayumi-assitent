"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export type GuideStep = {
  /** Ilustração (SVG inline). Decorativa: o texto do passo é a descrição, então ela fica fora do leitor de tela. */
  art: ReactNode;
  text: ReactNode;
};

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden="true"
    >
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Passo a passo ilustrado: um passo por vez, arrastando para o lado (rolagem nativa com encaixe) ou pelos botões.
 * O texto fica sempre embaixo da ilustração. Funciona igual no celular, no painel lateral do tablet e no desktop.
 * `data-vaul-no-drag`: arrastar para o lado aqui não puxa a folha.
 */
export function StepGuide({ steps, label }: { steps: GuideStep[]; label: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = steps.length - 1;

  function go(i: number) {
    const el = ref.current;
    if (!el) return;
    const next = Math.max(0, Math.min(last, i));
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    el.scrollTo?.({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setIndex(next);
  }

  function onScroll() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(Math.max(0, Math.min(last, i)));
  }

  const nav = "grid size-11 place-content-center rounded-full btn-glass text-primary-text disabled:opacity-40";

  return (
    <section className="grid gap-3" aria-roledescription="carrossel" aria-label={label}>
      <div
        ref={ref}
        className="guide-scroll glass"
        onScroll={onScroll}
        data-vaul-no-drag=""
        tabIndex={0}
        role="group"
        aria-label={`${label}: arraste para o lado para ver os passos`}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            id={`${id}-${i}`}
            className="guide-slide grid content-start gap-3 p-3"
            role="group"
            aria-roledescription="passo"
            aria-label={`Passo ${i + 1} de ${steps.length}`}
            aria-hidden={i !== index ? true : undefined}
          >
            <div className="overflow-hidden rounded-2xl bg-soft" aria-hidden="true">
              {s.art}
            </div>
            <p className="grid grid-cols-[28px_1fr] items-start gap-3 px-1 pb-1 text-sm font-semibold">
              <span
                className="grid size-7 place-content-center rounded-full bg-primary font-bold text-on-primary"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="pt-1">{s.text}</span>
            </p>
          </div>
        ))}
      </div>
      {steps.length > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={nav}
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Passo anterior"
          >
            <Chevron dir="left" />
          </button>
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir para o passo ${i + 1}`}
                aria-current={i === index ? "step" : undefined}
                aria-controls={`${id}-${i}`}
                className="grid size-8 place-content-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-5 bg-primary" : "w-2 bg-primary/25"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            className={nav}
            onClick={() => go(index + 1)}
            disabled={index === last}
            aria-label="Próximo passo"
          >
            <Chevron dir="right" />
          </button>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        Passo {index + 1} de {steps.length}
      </p>
    </section>
  );
}
