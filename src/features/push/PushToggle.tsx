"use client";

import { useEffect, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { subscribePush, unsubscribePush } from "./actions";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { sendTestNotice, setGoodMorning } from "@/features/owner-notices/actions";

type State = "checking" | "unsupported" | "denied" | "off" | "on";

function keyToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Ajustes > Notificação: liga os avisos neste aparelho, o bom dia das 7h e o botão de teste. */
export function PushToggle({ publicKey, goodMorning }: { publicKey: string | null; goodMorning: boolean }) {
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

  const [morning, setMorning] = useState(goodMorning);
  const [savingMorning, startMorning] = useTransition();
  const [testing, startTest] = useTransition();

  function toggleMorning(next: boolean) {
    startMorning(async () => {
      const res = await setGoodMorning(next).catch(() => null);
      if (res?.ok) {
        setMorning(next);
        notify.success(next ? "Bom dia das 7h ligado" : "Bom dia das 7h desligado");
      } else notify.error(res ? res.code : "NETWORK", () => toggleMorning(next));
    });
  }

  function test() {
    startTest(async () => {
      const res = await sendTestNotice().catch(() => null);
      if (res?.ok)
        notify.success(
          "Aviso de teste enviado",
          "Bloqueie a tela do iPhone: ele chega em alguns segundos, como os avisos de verdade.",
        );
      else notify.error(res ? res.code : "NETWORK", test);
    });
  }

  return (
    <div className="glass grid gap-4 rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <TileTitle as="h2" icon="phone" tint="pink">
            Notificação
          </TileTitle>
          <p className="text-sm font-semibold text-muted">{hint[state]}</p>
        </div>
        {state !== "checking" && (
          <Switch
            checked={state === "on"}
            onChange={(on) => (on ? enable() : disable())}
            busy={pending}
            disabled={state === "unsupported" || state === "denied"}
            label="Notificação neste aparelho"
          />
        )}
      </div>
      <p className="text-sm font-semibold text-muted">
        Resumo das clientes do dia com a previsão do tempo, folga, fim do expediente, roteiro da semana no domingo à
        noite e datas comemorativas. Chegam com o app fechado, na tela bloqueada.
      </p>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">Bom dia às 7h</p>
          <p className="text-sm font-semibold text-muted">Uma mensagem motivacional todo dia, sem repetir.</p>
        </div>
        <Switch checked={morning} onChange={toggleMorning} busy={savingMorning} label="Bom dia às 7h" />
      </div>
      {state === "on" ? (
        <button
          type="button"
          onClick={test}
          disabled={testing}
          aria-busy={testing}
          className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold disabled:opacity-60"
        >
          {testing ? <span className="spin" aria-hidden="true" /> : <Icon name="bell" />}
          {testing ? "Enviando…" : "Enviar aviso de teste"}
        </button>
      ) : null}
    </div>
  );
}
