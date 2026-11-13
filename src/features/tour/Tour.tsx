"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { finishTour } from "./actions";
import { TOUR_STEPS, unionBox, type Box } from "./steps";

/** No desktop a barra do rodapé existe no DOM mas está escondida: o tour olha só o que aparece. */
const firstVisible = (selector: string) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.getClientRects().length > 0) ?? null;

const START_TOUR = "tour:start";

/** Abre o tour de novo (botão em Ajustes). */
export function startTour() {
  window.dispatchEvent(new Event(START_TOUR));
}

/** Destaque mais alto que isso (fração da tela) mostra só o começo do cartão, para o texto caber embaixo. */
const MAX_HOLE = 0.42;

function measure(selector: string | undefined): Box | null {
  if (!selector) return null;
  const rects = [...document.querySelectorAll(selector)]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0);
  const box = unionBox(rects.map((r) => ({ top: r.top, left: r.left, width: r.width, height: r.height })));
  const max = window.innerHeight * MAX_HOLE;
  return box && box.height > max ? { ...box, height: max } : box;
}

/**
 * Tour de primeiro acesso: escurece a tela, recorta o destaque e a Bolha explica num cartão. Fica todo em Ajustes
 * e aponta cada linha a configurar (WhatsApp, calendários, notificação, mensagens e horários). No primeiro acesso é obrigatório, sem
 * "Pular"; quem reabre por Ajustes pode pular. Nos passos "tap" só o destaque recebe toque e o toque real avança.
 */
export function Tour({ autoStart }: { autoStart: boolean }) {
  // O layout persiste entre telas: abre sozinho só na primeira montagem
  const [step, setStep] = useState<number | null>(autoStart ? 0 : null);
  const [mandatory, setMandatory] = useState(autoStart);
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
      let n = s + 1;
      // Passo opcional sem o destaque na tela (app já instalado) é pulado
      while (n < TOUR_STEPS.length - 1 && TOUR_STEPS[n].optional && !firstVisible(TOUR_STEPS[n].target ?? "")) n++;
      return n < TOUR_STEPS.length ? n : s;
    });
  }, []);

  const begin = useCallback(() => {
    setMandatory(false);
    setStep(0);
  }, []);

  // Cada passo acontece na sua tela (hoje todos em Ajustes): quem abre o app no Painel é levado para lá
  useEffect(() => {
    if (current?.path && pathname !== current.path) router.push(current.path);
  }, [current, pathname, router]);

  useEffect(() => {
    window.addEventListener(START_TOUR, begin);
    return () => window.removeEventListener(START_TOUR, begin);
  }, [begin]);

  // Segue o destaque a cada quadro: ele anima (leque) e a página rola
  useLayoutEffect(() => {
    if (!current) return;
    // querySelector("") lança SyntaxError: passo sem destaque (o primeiro e o último) não rola nada
    // Cartão alto (as mensagens) rola até o começo; o resto fica no meio da tela
    if (current.target) {
      const el = firstVisible(current.target);
      const tall = el ? el.getBoundingClientRect().height > window.innerHeight * MAX_HOLE : false;
      el?.scrollIntoView({ block: tall ? "start" : "center", behavior: "smooth" });
    }
    let raf = 0;
    const tick = () => {
      setBox((prev) => {
        const b = measure(current.target);
        const same =
          prev &&
          b &&
          Math.abs(prev.top - b.top) +
            Math.abs(prev.left - b.left) +
            Math.abs(prev.width - b.width) +
            Math.abs(prev.height - b.height) <
            0.5;
        return same ? prev : b;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
    // pathname: ao trocar de tela, o destaque só existe depois que a nova página monta
  }, [current, pathname]);

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
    const onKey = (e: KeyboardEvent) => !mandatory && e.isTrusted && e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, close, mandatory]);

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
          <div
            className="tour-hole"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
            aria-hidden="true"
          />
          {tapping ? (
            // Quatro faixas em volta do furo: bloqueiam o resto e deixam o destaque tocável
            <>
              <div className="tour-block" style={{ top: 0, left: 0, right: 0, height: Math.max(0, box.top) }} />
              <div className="tour-block" style={{ top: box.top + box.height, left: 0, right: 0, bottom: 0 }} />
              <div
                className="tour-block"
                style={{ top: box.top, left: 0, width: Math.max(0, box.left), height: box.height }}
              />
              <div
                className="tour-block"
                style={{ top: box.top, left: box.left + box.width, right: 0, height: box.height }}
              />
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
        style={
          box
            ? cardBelow
              ? {
                  top: box.top + box.height + 14,
                  bottom: "calc(env(safe-area-inset-bottom) + 16px)",
                  // Se o texto for maior que o espaço livre, o cartão rola por dentro em vez de sair da tela
                  maxHeight: Math.max(160, vh - (box.top + box.height + 14) - 16),
                }
              : {
                  top: "calc(env(safe-area-inset-top) + 64px)",
                  bottom: vh - box.top + 14,
                  maxHeight: Math.max(160, box.top - 14 - 64),
                }
            : undefined
        }
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
          {last || mandatory ? (
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
              {step === 0 ? "Começar" : last ? "Vamos configurar" : "Próximo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
