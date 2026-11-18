"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Pílula da tela atual que desliza de um item para o outro no menu lateral: mostra para onde a navegação foi
 * (sem reload, a troca de tela é rápida e o olho perde o item aceso). Mede o link com `aria-current="page"` e
 * passa posição/tamanho em variáveis CSS; sem item aceso a pílula some. "Reduzir movimento" desliga o deslize
 * no CSS (a pílula só aparece no lugar).
 */
export function useNavIndicator<T extends HTMLElement>(key: string) {
  const navRef = useRef<T>(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const place = () => {
      const on = nav.querySelector<HTMLElement>('.sidenav-link[aria-current="page"]');
      if (!on) {
        nav.style.setProperty("--ind-o", "0");
        return;
      }
      const n = nav.getBoundingClientRect();
      const r = on.getBoundingClientRect();
      nav.style.setProperty("--ind-x", `${r.left - n.left + nav.scrollLeft}px`);
      nav.style.setProperty("--ind-y", `${r.top - n.top + nav.scrollTop}px`);
      nav.style.setProperty("--ind-w", `${r.width}px`);
      nav.style.setProperty("--ind-h", `${r.height}px`);
      nav.style.setProperty("--ind-o", "1");
      // Primeira medida sem deslize (a pílula nasce no lugar); depois desliza
      requestAnimationFrame(() => nav.setAttribute("data-ind-ready", ""));
    };
    place();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [key]);
  return navRef;
}
