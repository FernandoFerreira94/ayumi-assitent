"use client";

import { useCallback, useSyncExternalStore } from "react";
import { detectPlatform, type InstallPlatform } from "./platform";

const STANDALONE = "(display-mode: standalone)";

/** Evento do Chrome/Android que permite abrir o instalador nativo (não existe no Safari do iPhone). */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const mq = window.matchMedia(STANDALONE);
  const onPrompt = (e: Event) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  };
  const onInstalled = () => {
    deferred = null;
    emit();
  };
  mq.addEventListener("change", onChange);
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", onChange);
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

/** Texto estável para o useSyncExternalStore comparar: "plataforma|pode-instalar-direto"; vazio = já instalado. */
function snapshot(): string {
  const installed =
    window.matchMedia(STANDALONE).matches || (navigator as { standalone?: boolean }).standalone === true;
  if (installed) return "";
  return `${detectPlatform(navigator.userAgent, navigator.maxTouchPoints)}|${deferred ? "1" : "0"}`;
}

export type InstallState = { platform: InstallPlatform; canPrompt: boolean; prompt: () => Promise<void> };

/** null = já instalado (aberto pelo ícone) ou ainda no servidor: não há o que mostrar nem ensinar. */
export function useInstall(): InstallState | null {
  const snap = useSyncExternalStore(subscribe, snapshot, () => "");
  const prompt = useCallback(async () => {
    const ev = deferred;
    if (!ev) return;
    deferred = null;
    emit();
    await ev.prompt();
    await ev.userChoice.catch(() => null);
  }, []);
  if (!snap) return null;
  const [platform, can] = snap.split("|");
  return { platform: platform as InstallPlatform, canPrompt: can === "1", prompt };
}
