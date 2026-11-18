"use client";

import { useEffect, useState } from "react";
import { nativePermission, nativePushPlatform, savedToken } from "@/features/native/push";
import type { PushState } from "@/features/settings/connection-status";
import { PUSH_CHANGED } from "@/features/settings/live-events";

/**
 * Estado do push NESTE aparelho, só para mostrar (o interruptor fica no PushToggle).
 * App da loja: permissão nativa + token salvo. Navegador/PWA: permissão + inscrição do service worker.
 */
export function usePushState(): PushState {
  const [state, setState] = useState<PushState>("checking");
  useEffect(() => {
    let alive = true;
    const set = (s: PushState) => alive && setState(s);
    const check = async () => {
      if (nativePushPlatform()) {
        const perm = await nativePermission();
        return set(perm === "denied" ? "denied" : perm === "granted" && savedToken() ? "on" : "off");
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
        return set("unsupported");
      if (Notification.permission === "denied") return set("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      set(sub ? "on" : "off");
    };
    const run = () => void check().catch(() => set("unsupported"));
    run();
    // O interruptor da Notificação avisa quando muda: o selo acompanha na hora
    window.addEventListener(PUSH_CHANGED, run);
    return () => {
      alive = false;
      window.removeEventListener(PUSH_CHANGED, run);
    };
  }, []);
  return state;
}
