"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_MASCOT, isMascotKind, type MascotKind } from "./mascots";

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mascot"] });
  return () => obs.disconnect();
}

const read = (): MascotKind => {
  const m = document.documentElement.dataset.mascot;
  return isMascotKind(m) ? m : DEFAULT_MASCOT;
};

/** Mascote escolhido (atributo data-mascot do <html>); no servidor, sempre a Bolha. */
export function useMascotKind(): MascotKind {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_MASCOT);
}
