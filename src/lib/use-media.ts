"use client";

import { useSyncExternalStore } from "react";

/** Tablet e desktop (md do Tailwind): a barra do rodapé some e as folhas abrem de lado. */
export const WIDE_QUERY = "(min-width: 48rem)";

/**
 * Lê uma media query e acompanha a mudança (girar o iPad, redimensionar a janela).
 * No servidor e na hidratação devolve false: a primeira pintura é a do celular, e folha só abre depois de um toque.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsWide = () => useMediaQuery(WIDE_QUERY);
