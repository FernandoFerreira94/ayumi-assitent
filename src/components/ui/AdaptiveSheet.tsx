// src/components/ui/AdaptiveSheet.tsx
"use client";

import { Drawer } from "vaul";
import { useIsWide } from "@/lib/use-media";

export type SheetSide = "bottom" | "right";

/** Painel do tablet/desktop: altura toda, 440 px, colado à direita. O z-index fica com quem chama (vai em `shared`). */
export const SIDE_PANEL =
  "fixed inset-y-0 right-0 flex h-dvh w-[min(440px,100vw)] flex-col overflow-y-auto rounded-l-3xl px-6 pb-6 pt-[max(env(safe-area-inset-top),24px)] outline-none";

/** Celular: folha que sobe de baixo (como sempre). Tablet e desktop: painel à direita, que deixa a tela visível. */
export function useSheetSide(): SheetSide {
  return useIsWide() ? "right" : "bottom";
}

/** `bottom` é a classe de posição e tamanho da folha no celular; `shared` vale nos dois lados (fundo, z-index, flex). */
export function sheetClass(side: SheetSide, bottom: string, shared = ""): string {
  return [shared, side === "right" ? SIDE_PANEL : bottom].filter(Boolean).join(" ");
}

/** No painel lateral não há "puxar para baixo": botão Fechar visível. Esc também fecha (vaul). */
export function SidePanelClose() {
  return (
    <Drawer.Close
      aria-label="Fechar"
      className="absolute right-4 top-[max(env(safe-area-inset-top),16px)] hidden size-11 place-content-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-primary md:grid"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </Drawer.Close>
  );
}
