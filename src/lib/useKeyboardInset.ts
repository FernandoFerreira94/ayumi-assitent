"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * No iPhone o teclado não encolhe a tela: ele cobre o fim dela. Mede a parte
 * coberta pelo visualViewport e devolve o estilo que sobe o sheet e limita a altura.
 */
export function useKeyboardInset(active: boolean): CSSProperties {
  const [inset, setInset] = useState({ bottom: 0, height: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () =>
      setInset({ bottom: Math.max(0, window.innerHeight - vv.height - vv.offsetTop), height: vv.height });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);

  if (!inset.height) return {};
  return { bottom: inset.bottom, maxHeight: inset.height - 12, overflowY: "auto" };
}
