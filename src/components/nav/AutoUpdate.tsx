"use client";

import { useEffect } from "react";
import { notify } from "@/components/feedback/toast";
import { applyUpdate, fetchServerBuild, isBusy, takeJustUpdated, UPDATING_TO_KEY } from "@/lib/update-check";

const CURRENT = process.env.NEXT_PUBLIC_BUILD_ID ?? "";

/**
 * Atualiza o app sozinho, sem aviso. Confere ao abrir e ao voltar para o app (nunca no meio do uso) e só recarrega
 * se nada estiver aberto ou sendo digitado; senão tenta de novo na próxima volta. Depois mostra só um toast.
 */
export function AutoUpdate() {
  useEffect(() => {
    // Toast depois do recarregamento (espera o Toaster montar e a abertura passar)
    const toast = takeJustUpdated() ? setTimeout(() => notify.success("Seu app foi atualizado"), 900) : undefined;
    if (process.env.NODE_ENV !== "production" || !CURRENT) return () => clearTimeout(toast);

    let running = false;
    async function check() {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      const server = await fetchServerBuild();
      running = false;
      if (!server || server === CURRENT || isBusy()) return;
      try {
        // Trava de laço: se já tentou ir para esta versão nesta aba e ela não veio, não insiste
        if (sessionStorage.getItem(UPDATING_TO_KEY) === server) return;
        sessionStorage.setItem(UPDATING_TO_KEY, server);
      } catch {
        return;
      }
      await applyUpdate();
    }

    const first = setTimeout(() => void check(), 0);
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      clearTimeout(toast);
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, []);
  return null;
}
