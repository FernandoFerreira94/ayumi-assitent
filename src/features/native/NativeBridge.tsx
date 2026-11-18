"use client";

import { useEffect } from "react";
import { isNativeShell } from "@/features/install/platform";
import { safeAppPath } from "@/features/push/native-core";
import { backAction, OPEN_LAYER } from "./back";
import { APP_LINK_PREFIX } from "./links";

/**
 * Só roda dentro do app da loja (casca Capacitor). Escuta os links br.app.bubbly://... que abrem o app.
 * Volta do login do Google, botão voltar do Android e toque numa notificação nativa.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeShell(navigator.userAgent)) return;
    const handles: { remove: () => Promise<void> }[] = [];
    let cancelled = false;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      const { App } = await import("@capacitor/app");
      handles.push(
        await App.addListener("appUrlOpen", async ({ url }) => {
          if (!url.startsWith(`${APP_LINK_PREFIX}auth`)) return;
          const { finishNativeGoogleLogin } = await import("./google-login");
          const result = await finishNativeGoogleLogin(url);
          // Navegação completa: o servidor lê o cookie novo e o proxy leva para a agenda
          location.replace(result.ok ? "/agenda" : `/login?error=${encodeURIComponent(result.error)}`);
        }),
      );
      // Android: sem isto, o voltar com uma folha aberta trocava de página por baixo dela
      handles.push(
        await App.addListener("backButton", ({ canGoBack }) => {
          const action = backAction(!!document.querySelector(OPEN_LAYER), canGoBack);
          if (action === "close") {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          } else if (action === "back") history.back();
          else void App.minimizeApp();
        }),
      );
      if (Capacitor.isPluginAvailable("PushNotifications")) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        handles.push(
          await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
            const data = notification.data as { url?: unknown } | undefined;
            location.assign(safeAppPath(data?.url));
          }),
        );
      }
      if (cancelled) handles.forEach((h) => void h.remove());
    })();
    return () => {
      cancelled = true;
      handles.forEach((h) => void h.remove());
    };
  }, []);
  return null;
}
