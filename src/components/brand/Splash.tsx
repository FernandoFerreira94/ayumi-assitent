"use client";

import { useEffect, useState } from "react";
import { Mascot } from "./Mascot";
import { Wordmark } from "./Wordmark";

/** Some de vez depois disso (a animação inteira cabe em menos de 2 s + o fade). */
const TOTAL_MS = 2300;
/** Quando o Mimo abre os olhos, depois de surgir de olhos fechados. */
const EYES_MS = 1350;
export const SPLASH_KEY = "mimo-splash";

/**
 * Roda no <head>, antes de pintar: se o splash já passou nesta abertura do app (ou é teste
 * automatizado), esconde antes do primeiro quadro, para não piscar.
 */
export const splashGate = `try{if(sessionStorage.getItem("${SPLASH_KEY}")||navigator.webdriver)document.documentElement.dataset.splash="off"}catch(e){}`;

/**
 * Entrada "Revelação": a bolha cresce na tela lavanda, vira o Mimo e a tela clara se abre de dentro
 * dela. Só na primeira abertura do app (sessionStorage zera quando o app é aberto do zero).
 */
export function Splash() {
  const [gone, setGone] = useState(false);
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    // Já visto nesta abertura: o CSS esconde ([data-splash="off"]); não precisa de timer
    if (document.documentElement.dataset.splash === "off") return;
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {}
    const eyes = setTimeout(() => setAwake(true), EYES_MS);
    const end = setTimeout(() => setGone(true), TOTAL_MS);
    return () => {
      clearTimeout(eyes);
      clearTimeout(end);
    };
  }, []);

  if (gone) return null;
  return (
    // pointer-events: none — o app por baixo já está pronto; o splash não segura o toque
    <div className="splash" aria-hidden="true">
      <div className="splash-flood" />
      <svg viewBox="0 0 480 420" className="splash-film">
        <defs>
          <linearGradient id="splash-film" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor="#FF8FB1" />
            <stop offset="0.7" stopColor="#B9A6FF" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        <circle cx="240" cy="210" r="118" fill="rgba(255,255,255,.12)" stroke="url(#splash-film)" strokeWidth="5" />
        <ellipse cx="187" cy="151" rx="21" ry="8" transform="rotate(-34 187 151)" fill="rgba(255,255,255,.8)" />
      </svg>
      <div className="splash-mimo">
        <Mascot mood={awake ? "neutral" : "happy"} size={220} />
        <span className="splash-shadow" />
      </div>
      <div className="splash-word grid justify-items-center gap-1">
        <Wordmark className="text-[2.4rem]" />
        <span className="text-sm font-semibold text-muted">sua agenda com carinho</span>
      </div>
    </div>
  );
}
