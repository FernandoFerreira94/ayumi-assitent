"use client";

import { useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import { flushSync } from "react-dom";
import { EASE, reducedMotion } from "./motion";

export type PagerHandle = { go: (dir: 1 | -1) => void };

/** Quanto do arrasto (fração da largura) ou que velocidade (px/ms) já vira a página. */
const DIST = 0.22;
const SPEED = 0.35;

/**
 * Carrossel de 3 páginas (anterior, atual, próxima) que segue o dedo e encaixa, como o mês no iPhone.
 * A rolagem vertical continua nativa (touch-action: pan-y); só o gesto lateral é nosso.
 */
export function Pager({
  prev,
  cur,
  next,
  onPage,
  label,
  ref,
}: {
  prev: { key: string; node: ReactNode };
  cur: { key: string; node: ReactNode };
  next: { key: string; node: ReactNode };
  onPage: (dir: 1 | -1) => void;
  label: string;
  ref?: Ref<PagerHandle>;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; t: number; dx: number; horiz?: boolean } | null>(null);
  const swallowClick = useRef(false);

  const settle = (dir: -1 | 0 | 1, fromDx: number, velocity = 0) => {
    const el = track.current;
    const w = wrap.current?.clientWidth ?? 0;
    if (!el || !w) return;
    if (reducedMotion() && dir) {
      el.style.transform = "";
      onPage(dir);
      return;
    }
    busy.current = true;
    const to = -dir * w;
    // dedo rápido = encaixe mais curto, como no iOS
    const ms = Math.max(180, Math.min(380, Math.abs(to - fromDx) / Math.max(Math.abs(velocity), 1.2)));
    el.style.transform = "";
    const a = el.animate([{ transform: `translateX(${fromDx}px)` }, { transform: `translateX(${to}px)` }], {
      duration: ms,
      easing: EASE,
      fill: "forwards",
    });
    a.onfinish = () => {
      // troca o conteúdo e tira a animação no mesmo quadro: sem piscar
      if (dir) flushSync(() => onPage(dir));
      a.cancel();
      busy.current = false;
    };
  };

  useImperativeHandle(ref, () => ({ go: (dir) => !busy.current && settle(dir, 0) }));

  const onDown = (e: React.PointerEvent) => {
    if (busy.current || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0 };
    swallowClick.current = false;
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.horiz === undefined) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      d.horiz = Math.abs(dx) > Math.abs(dy) * 1.15;
      if (!d.horiz) {
        drag.current = null; // rolagem vertical: deixa com o navegador
        return;
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      swallowClick.current = true;
    }
    d.dx = dx;
    if (track.current) track.current.style.transform = `translateX(${dx}px)`;
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.horiz) return;
    const w = wrap.current?.clientWidth ?? 1;
    const v = d.dx / Math.max(e.timeStamp - d.t, 1);
    const dir = d.dx < -w * DIST || v < -SPEED ? 1 : d.dx > w * DIST || v > SPEED ? -1 : 0;
    settle(e.type === "pointercancel" ? 0 : dir, d.dx, v);
  };

  return (
    <div
      ref={wrap}
      className="cal-pager"
      role="group"
      aria-roledescription="carrossel"
      aria-label={label}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClickCapture={(e) => {
        // arrastar para o lado não abre o mês/dia que estava sob o dedo
        if (swallowClick.current) {
          e.preventDefault();
          e.stopPropagation();
          swallowClick.current = false;
        }
      }}
    >
      <div ref={track} className="cal-track">
        <div key={prev.key} className="cal-page" data-side="prev" aria-hidden="true" inert>
          {prev.node}
        </div>
        <div key={cur.key} className="cal-page">
          {cur.node}
        </div>
        <div key={next.key} className="cal-page" data-side="next" aria-hidden="true" inert>
          {next.node}
        </div>
      </div>
    </div>
  );
}
