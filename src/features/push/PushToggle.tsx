"use client";

import { useEffect, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { subscribePush, unsubscribePush } from "./actions";

type State = "checking" | "unsupported" | "denied" | "off" | "on";

function keyToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<State>("checking");
  const [pending, start] = useTransition();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window))
        return alive && setState("unsupported");
      if (Notification.permission === "denied") return alive && setState("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (alive) setState(sub ? "on" : "off");
    })().catch(() => alive && setState("unsupported"));
    return () => {
      alive = false;
    };
  }, [publicKey]);

  function enable() {
    start(async () => {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setState(perm === "denied" ? "denied" : "off");
          notify.error("NOT_ALLOWED");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(publicKey!),
        });
        const res = await subscribePush(sub.toJSON());
        if (!res.ok) {
          await sub.unsubscribe();
          notify.error(res.code, enable);
          return;
        }
        setState("on");
        notify.success("Avisos ativados neste aparelho");
      } catch {
        notify.error("NETWORK", enable);
      }
    });
  }

  function disable() {
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const res = await unsubscribePush(sub.endpoint);
          if (!res.ok) {
            notify.error(res.code, disable);
            return;
          }
          await sub.unsubscribe();
        }
        setState("off");
        notify.success("Avisos desativados");
      } catch {
        notify.error("NETWORK", disable);
      }
    });
  }

  const hint: Record<State, string> = {
    checking: "Verificando…",
    unsupported: "Disponível quando o app estiver instalado na tela de início e configurado.",
    denied: "Bloqueado nos Ajustes do iPhone. Libere as notificações do app para ativar.",
    off: "Receba um aviso quando houver pendências na agenda.",
    on: "Ativo neste aparelho.",
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
      <div>
        <p className="font-bold">Avisos no celular</p>
        <p className="text-sm font-semibold text-muted">{hint[state]}</p>
      </div>
      {(state === "off" || state === "on") && (
        <button
          type="button"
          onClick={state === "on" ? disable : enable}
          disabled={pending}
          aria-busy={pending}
          className="min-h-11 shrink-0 rounded-full bg-soft px-4 text-sm font-bold text-primary-text active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Aguarde…" : state === "on" ? "Desativar" : "Ativar"}
        </button>
      )}
    </div>
  );
}
