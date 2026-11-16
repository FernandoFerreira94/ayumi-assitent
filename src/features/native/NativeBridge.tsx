"use client";

import { useEffect } from "react";
import { isNativeShell } from "@/features/install/platform";
import { APP_LINK_PREFIX } from "./links";

/**
 * Só roda dentro do app da loja (casca Capacitor). Escuta os links br.app.bubbly://... que abrem o app.
 * Hoje: volta do login do Google. Os próximos recursos nativos (voltar do Android, push) entram aqui.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeShell(navigator.userAgent)) return;
    let remove: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith(`${APP_LINK_PREFIX}auth`)) return;
        const { finishNativeGoogleLogin } = await import("./google-login");
        const result = await finishNativeGoogleLogin(url);
        // Navegação completa: o servidor lê o cookie novo e o proxy leva para a agenda
        location.replace(result.ok ? "/agenda" : `/login?error=${encodeURIComponent(result.error)}`);
      });
      if (cancelled) void handle.remove();
      else remove = () => void handle.remove();
    })();
    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
  return null;
}
