"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { finishTour } from "./actions";
import { TOUR_STEPS, unionBox, type Box } from "./steps";

const START_TOUR = "tour:start";

/** Abre o tour de novo (botão em Ajustes). */
export function startTour() {
  window.dispatchEvent(new Event(START_TOUR));
}

function measure(selector: string | undefined): Box | null {
  if (!selector) return null;
  const rects = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect());
  return unionBox(rects.map((r) => ({ top: r.top, left: r.left, width: r.width, height: r.height })));
}

/**
 * Tour de primeiro acesso: escurece a tela, recorta o destaque e a Bolha explica num cartão.
 * Nos passos "tap" só o destaque recebe toque (o resto fica bloqueado) e o toque real avança.
 */
export function Tour({ autoStart }: { autoStart: boolean }) {
  // O layout persiste entre telas: abre sozinho só na primeira montagem
  const [step, setStep] = useState<number | null>(autoStart ? 0 : null);
  const [box, setBox] = useState<Box | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);
  const current = step === null ? null : TOUR_STEPS[step];

  const close = useCallback(() => {
    setStep(null);
    // Fecha o leque se o tour terminou com ele aberto (o FanNav escuta Escape na janela)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    void finishTour();
  }, []);

  const next = useCallback(() => {
    setStep((s) => {
      if (s === null) return null;
      // Sair do passo do leque fecha o leque, para o sino ficar à vista
      if (TOUR_STEPS[s].target?.includes("fan-link")) window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      return s + 1 < TOUR_STEPS.length ? s + 1 : s;
    });
  }, []);

  const begin = useCallback(() => {
    if (pathname !== "/agenda") router.push("/agenda");
    setStep(0);
  }, [pathname, router]);

  useEffect(() => {
    window.addEventListener(START_TOUR, begin);
    return () => window.removeEventListener(START_TOUR, begin);
  }, [begin]);

  // Segue o destaque a cada quadro: ele anima (leque) e a página rola
  useLayoutEffect(() => {
    if (!current) return;
    document.querySelector(current.target ?? "")?.scrollIntoView({ block: "center", behavior: "smooth" });
    let raf = 0;
    const tick = () => {
      setBox((prev) => {
        const b = measure(current.target);
        const same = prev && b && Math.abs(prev.top - b.top) + Math.abs(prev.left - b.left) + Math.abs(prev.width - b.width) + Math.abs(prev.height - b.height) < 0.5;
        return same ? prev : b;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [current]);

  // Passo "tap": o toque de verdade no destaque avança (a ação dele acontece normalmente)
  useEffect(() => {
    if (!current || current.advance !== "tap" || !current.target) return;
    const selector = current.target;
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest(selector)) setTimeout(next, 120);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [current, next]);

  useEffect(() => {
    if (!current) return;
    // Escape sintético (o que fecha o leque) não conta: só o da pessoa pula o tour
    const onKey = (e: KeyboardEvent) => e.isTrusted && e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, close]);

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [step]);

  if (!current || step === null) return null;

  // Sem o destaque na tela (outra página, leque fechado), o passo vira "next" para ninguém ficar preso
  const tapping = current.advance === "tap" && box !== null;
  const last = step === TOUR_STEPS.length - 1;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const cardBelow = box ? box.top + box.height / 2 < vh / 2 : false;

  return (
    <div className="tour" data-step={step}>
      {box ? (
        <>
          <div className="tour-hole" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} aria-hidden="true" />
          {tapping ? (
            // Quatro faixas em volta do furo: bloqueiam o resto e deixam o destaque tocável
            <>
              <div className="tour-block" style={{ top: 0, left: 0, right: 0, height: Math.max(0, box.top) }} />
              <div className="tour-block" style={{ top: box.top + box.height, left: 0, right: 0, bottom: 0 }} />
              <div className="tour-block" style={{ top: box.top, left: 0, width: Math.max(0, box.left), height: box.height }} />
              <div className="tour-block" style={{ top: box.top, left: box.left + box.width, right: 0, height: box.height }} />
            </>
          ) : (
            <div className="tour-block inset-0" />
          )}
        </>
      ) : (
        <div className="tour-block tour-dim inset-0" />
      )}

      <div
        key={step}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="tour-card glass"
        data-place={box ? (cardBelow ? "below" : "above") : "center"}
        style={box ? (cardBelow ? { top: box.top + box.height + 14 } : { bottom: vh - box.top + 14 }) : undefined}
      >
        <div className="flex items-start gap-3">
          <span key={step} className="mascot-hop shrink-0">
            <Mascot size={52} mood={last || step === 0 ? "happy" : "neutral"} idle />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">
              {step + 1} de {TOUR_STEPS.length}
            </p>
            <h2 id={titleId} className="text-lg font-bold leading-tight">
              {current.title}
            </h2>
            <p aria-live="polite" className="mt-1 text-sm font-semibold leading-snug text-fg/80">
              {current.text}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          {last ? (
            <span />
          ) : (
            <button type="button" onClick={close} className="min-h-11 rounded-full px-4 text-sm font-bold text-muted">
              Pular tour
            </button>
          )}
          {tapping ? (
            <p className="tour-hint text-sm font-bold text-primary-text">Toque no destaque</p>
          ) : (
            <button
              ref={primaryRef}
              type="button"
              onClick={last ? close : next}
              className="btn-tint min-h-11 rounded-full px-5 text-sm font-bold"
            >
              {step === 0 ? "Começar" : last ? "Começar a usar" : "Próximo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
