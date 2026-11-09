"use client";

import { useCallback, useEffect, useState } from "react";
import { applyUpdate, fetchServerBuild } from "@/lib/update-check";

const CURRENT = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
const EVERY = 10 * 60_000;

/**
 * Aviso fixo de "nova versão". Confere ao abrir, ao voltar para o app e a cada 10 min. Fica embaixo,
 * acima do botão do menu (os toasts ficam no topo), até a pessoa tocar em "Atualizar": nada muda sozinho.
 */
export function UpdateBanner() {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    if (!CURRENT || document.visibilityState !== "visible") return;
    const server = await fetchServerBuild();
    if (server && server !== CURRENT) setAvailable(true);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const first = setTimeout(() => void check(), 0);
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onVisible);
    const id = setInterval(() => void check(), EVERY);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onVisible);
      clearTimeout(first);
      clearInterval(id);
    };
  }, [check]);

  if (!available) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(18px,env(safe-area-inset-bottom))+76px)] z-[25] flex justify-center px-3.5">
      <div
        role="status"
        aria-live="polite"
        className="glass pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full py-2 pl-5 pr-2"
      >
        <p className="min-w-0 flex-1 text-sm font-bold text-fg">Nova versão disponível</p>
        <button
          type="button"
          onClick={() => {
            setBusy(true);
            void applyUpdate();
          }}
          disabled={busy}
          aria-busy={busy}
          className="btn-tint h-11 shrink-0 rounded-full px-5 text-sm font-bold disabled:opacity-60"
        >
          {busy ? "Atualizando…" : "Atualizar"}
        </button>
      </div>
    </div>
  );
}
