"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notify } from "@/components/feedback/toast";
import { authClient } from "@/lib/auth-client";
import { TileTitle } from "@/components/ui/Icon";
import { disconnectGoogle } from "./actions";
import { Switch } from "@/components/ui/Switch";

/**
 * Liga a conta Google à conta do app para os agendamentos irem para o Google Agenda.
 * Interruptor ligado = conectado (não há "Reconectar": o acesso se renova sozinho). Ligar abre o Google;
 * desligar pergunta antes e desfaz o vínculo.
 */
const ERROR_HINTS: Record<string, string> = {
  access_denied: "O acesso à agenda foi negado. Ligue de novo e marque a permissão da agenda.",
  state_mismatch: "A sessão do navegador mudou no meio do caminho. Ligue de novo sem sair do app.",
  please_restart_the_process: "A sessão do navegador mudou no meio do caminho. Ligue de novo.",
  social_account_already_linked: "Essa conta Google já está ligada a outro usuário do app.",
  unable_to_link_account: "Não foi possível ligar essa conta Google. Tente de novo.",
};

export function GoogleCard({
  connected: initialConnected,
  failed,
  errorCode,
}: {
  connected: boolean;
  failed: boolean;
  errorCode?: string;
}) {
  const router = useRouter();
  const [connected, setConnected] = useState(initialConnected);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function connect() {
    setPending(true);
    const { error } = await authClient.linkSocial({
      provider: "google",
      callbackURL: "/ajustes#google",
      errorCallbackURL: "/ajustes?google=erro",
    });
    if (error) {
      setPending(false);
      notify.error("NETWORK", connect);
    }
    // Sem erro: o navegador segue para o Google; o interruptor continua em carregamento.
  }

  async function disconnect() {
    setPending(true);
    const res = await disconnectGoogle().catch(() => null);
    setPending(false);
    if (!res?.ok) {
      if (res?.code === "VALIDATION")
        notify.problem(
          "O Google é seu único acesso ao app",
          "Crie uma senha antes de desconectar, senão você perderia a entrada.",
        );
      else notify.error(res ? res.code : "NETWORK");
      return;
    }
    setConfirming(false);
    setConnected(false);
    notify.success("Google Agenda desconectado");
    router.refresh();
  }

  function toggle(on: boolean) {
    if (on) void connect();
    else setConfirming(true);
  }

  let hint = "Ligue para os agendamentos aparecerem no seu calendário do Google.";
  if (connected) hint = "Conectado. Os agendamentos vão para o seu calendário.";
  if (failed) {
    const known = errorCode ? ERROR_HINTS[errorCode.toLowerCase()] : undefined;
    hint =
      known ??
      `Não deu para conectar. Tente de novo e aceite o acesso à agenda.${errorCode ? ` (código: ${errorCode})` : ""}`;
  }

  if (confirming)
    return (
      <div
        className="glass grid gap-3 rounded-[1.75rem] px-5 py-4"
        role="alertdialog"
        aria-label="Desconectar o Google Agenda?"
      >
        <div>
          <p className="font-bold">Desconectar o Google Agenda?</p>
          <p className="text-sm font-semibold text-muted">
            Os agendamentos novos deixam de ir para o seu calendário e os eventos de lá param de entrar aqui.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60"
            onClick={() => setConfirming(false)}
            disabled={pending}
            autoFocus
          >
            Cancelar
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full bg-fail px-4 text-sm font-bold text-white disabled:opacity-60"
            onClick={() => void disconnect()}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Desconectando…" : "Desconectar"}
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex items-center justify-between gap-3 glass rounded-[1.75rem] px-5 py-4">
      <div>
        <TileTitle icon="calendar" tint="blue">
          Google Agenda
        </TileTitle>
        <p className={`text-sm font-semibold ${failed ? "text-fail" : "text-muted"}`}>{hint}</p>
      </div>
      <Switch checked={connected} onChange={toggle} busy={pending} label="Google Agenda" />
    </div>
  );
}
