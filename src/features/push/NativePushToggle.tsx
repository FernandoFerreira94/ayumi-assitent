"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { emitPushChanged } from "@/features/settings/live-events";
import {
  nativePermission,
  PushDenied,
  registerNativePush,
  savedToken,
  unregisterNativePush,
} from "@/features/native/push";
import { subscribeNativePush, unsubscribePush } from "./actions";
import { nativeEndpoint, type NativePlatform } from "./native-core";
import { PushCard } from "./PushCard";

type State = "checking" | "unsupported" | "denied" | "off" | "on";

/** App da loja: notificação nativa (Android pelo Firebase, iPhone pela Apple). */
export function NativePushToggle({ platform, ready }: { platform: NativePlatform; ready: boolean }) {
  const [state, setState] = useState<State>("checking");
  const [pending, start] = useTransition();
  const firstCheck = useRef(true);
  // Avisa o selo de Conexões quando o interruptor muda (a primeira leitura não é mudança)
  useEffect(() => {
    if (state === "checking") return;
    if (firstCheck.current) {
      firstCheck.current = false;
      return;
    }
    emitPushChanged();
  }, [state]);
  const phone = platform === "ios" ? "iPhone" : "celular";

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!ready) return alive && setState("unsupported");
      const perm = await nativePermission();
      if (!alive) return;
      if (perm === "denied") setState("denied");
      else setState(perm === "granted" && savedToken() ? "on" : "off");
    })().catch(() => alive && setState("unsupported"));
    return () => {
      alive = false;
    };
  }, [ready]);

  function enable() {
    start(async () => {
      try {
        const token = await registerNativePush();
        const res = await subscribeNativePush({ platform, token });
        if (!res.ok) {
          await unregisterNativePush();
          notify.error(res.code, enable);
          return;
        }
        setState("on");
        notify.success("Avisos ativados neste aparelho");
      } catch (e) {
        if (e instanceof PushDenied) {
          setState("denied");
          notify.warning(`Avisos bloqueados neste ${phone}`, `Libere em Ajustes do ${phone} → Bubbly → Notificações.`);
        } else {
          notify.error("NETWORK", enable);
        }
      }
    });
  }

  function disable() {
    start(async () => {
      try {
        const token = savedToken();
        if (token) {
          const res = await unsubscribePush(nativeEndpoint(platform, token));
          if (!res.ok) return void notify.error(res.code, disable);
        }
        await unregisterNativePush();
        setState("off");
        notify.success("Avisos desativados");
      } catch {
        notify.error("NETWORK", disable);
      }
    });
  }

  const hint: Record<State, string> = {
    checking: "Verificando…",
    unsupported: "Os avisos no app chegam em breve. Por enquanto, use o app pelo navegador para recebê-los.",
    denied: `Bloqueado nos Ajustes do ${phone}. Libere as notificações do Bubbly para ativar.`,
    off: "Receba um aviso quando houver pendências na agenda.",
    on: "Ativo neste aparelho.",
  };

  return (
    <PushCard
      hint={hint[state]}
      showSwitch={state !== "checking"}
      checked={state === "on"}
      busy={pending}
      disabled={state === "unsupported" || state === "denied"}
      onChange={(on) => (on ? enable() : disable())}
    />
  );
}
