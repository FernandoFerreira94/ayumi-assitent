"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { fetchServerBuild, isBusyEditing } from "@/lib/update-check";

const CURRENT = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
const TRIED = "mimo-update-tried";
const EVERY = 10 * 60_000;
const SHOW_MS = 1600;

/**
 * Atualização automática: ao abrir, ao voltar para o app (iPhone) e a cada 10 min, compara a versão
 * do servidor com a deste app. Se mudou, mostra o aviso e recarrega sozinho. Se a pessoa estiver
 * digitando ou com um diálogo aberto, espera ela terminar.
 */
export function UpdateGate() {
  const pathname = usePathname();
  const [updating, setUpdating] = useState(false);
  const typed = useRef(false);
  const running = useRef(false);

  // Texto digitado conta como edição em andamento até trocar de tela (ex.: depois de entrar).
  useEffect(() => {
    typed.current = false;
  }, [pathname]);

  useEffect(() => {
    const onInput = () => {
      typed.current = true;
    };
    document.addEventListener("input", onInput, true);
    return () => document.removeEventListener("input", onInput, true);
  }, []);

  const check = useCallback(async () => {
    if (!CURRENT || running.current || document.visibilityState !== "visible") return;
    running.current = true;
    try {
      const server = await fetchServerBuild();
      if (!server || server === CURRENT) return;
      // Já tentamos esta versão e continua diferente (servidor ainda trocando): não entra em loop.
      try {
        if (sessionStorage.getItem(TRIED) === server) return;
      } catch {}
      if (isBusyEditing(document, typed.current)) return;
      try {
        sessionStorage.setItem(TRIED, server);
      } catch {}
      setUpdating(true);
      const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
      await Promise.all([reg?.update().catch(() => {}), new Promise((r) => setTimeout(r, SHOW_MS))]);
      window.location.reload();
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    void check();
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onVisible);
    const id = setInterval(() => void check(), EVERY);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onVisible);
      clearInterval(id);
    };
  }, [check]);

  // Depois de sair de uma edição (diálogo fechado, campo sem foco), tenta de novo.
  useEffect(() => {
    const retry = () => setTimeout(() => void check(), 800);
    document.addEventListener("focusout", retry);
    return () => document.removeEventListener("focusout", retry);
  }, [check]);

  if (!updating) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-fg/20 px-6 backdrop-blur-sm">
      <div
        role="status"
        aria-live="polite"
        className="glass flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl px-6 py-7 text-center"
      >
        <Mascot mood="happy" size={72} />
        <p className="text-base font-bold text-fg">Nova versão disponível</p>
        <p className="text-sm font-semibold text-muted">Atualizando…</p>
      </div>
    </div>
  );
}
