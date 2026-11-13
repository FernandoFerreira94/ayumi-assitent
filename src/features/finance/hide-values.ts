"use client";

import { useSyncExternalStore } from "react";

/** Escolha de ocultar valores (olhinho, como app de banco), lembrada só neste aparelho. */
const KEY = "bubbly:ocultar-valores";
const EVENT = "bubbly:ocultar-valores";

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function setValuesHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // Sem armazenamento (aba privada): vale só até fechar
    memory = hidden;
  }
  window.dispatchEvent(new Event(EVENT));
}

let memory: boolean | null = null;

/**
 * true = valores escondidos; null = ainda no servidor (não sabe a escolha: mostra pontinhos, para nunca
 * piscar o valor de quem pediu para esconder).
 */
export function useValuesHidden(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => memory ?? read(),
    () => null,
  );
}
