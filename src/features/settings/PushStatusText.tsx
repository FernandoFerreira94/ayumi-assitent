"use client";

import { useEffect, useState } from "react";

/** Resumo da Notificação na lista de Ajustes: a inscrição é deste aparelho, então só o navegador sabe. */
export function PushStatusText() {
  const [text, setText] = useState("Avisos no celular e localização");
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission === "denied") return alive && setText("Bloqueada neste aparelho");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (alive) setText(sub ? "Ligada neste aparelho" : "Desligada neste aparelho");
    })().catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return <>{text}</>;
}
