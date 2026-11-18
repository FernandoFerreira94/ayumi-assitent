"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Diz se a resposta vai chegar no celular. A inscrição de push é deste aparelho, então só o navegador sabe;
 * sem notificação ligada, aponta para onde ligar (senão a pessoa fica esperando sem saber da resposta).
 */
export function PushHint() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return alive && setOn(false);
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (alive) setOn(Boolean(sub) && Notification.permission === "granted");
    })().catch(() => alive && setOn(false));
    return () => {
      alive = false;
    };
  }, []);
  if (on === null) return <p className="min-h-11 px-3" aria-hidden="true" />;
  return (
    <p className="flex min-h-11 flex-wrap items-center gap-x-1 px-3 text-sm font-semibold text-muted">
      {on ? (
        "Quando a gente responder, chega um aviso neste celular."
      ) : (
        <>
          A resposta aparece aqui.
          <Link href="/ajustes/notificacoes" className="inline-flex min-h-11 items-center font-bold text-primary-text underline">
            Ligar aviso no celular
          </Link>
        </>
      )}
    </p>
  );
}
