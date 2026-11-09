"use client";

import { useState } from "react";
import { notify } from "@/components/feedback/toast";
import { authClient } from "@/lib/auth-client";

/**
 * Liga a conta Google à conta do app para os agendamentos irem para o Google Agenda.
 * Reconectar refaz o mesmo vínculo e só renova o acesso (o better-auth atualiza os tokens da conta já ligada).
 */
const ERROR_HINTS: Record<string, string> = {
  access_denied: "O acesso à agenda foi negado. Toque em Conectar e marque a permissão da agenda.",
  state_mismatch: "A sessão do navegador mudou no meio do caminho. Toque em Conectar de novo sem sair do app.",
  please_restart_the_process: "A sessão do navegador mudou no meio do caminho. Toque em Conectar de novo.",
  social_account_already_linked: "Essa conta Google já está ligada a outro usuário do app.",
  unable_to_link_account: "Não foi possível ligar essa conta Google. Tente de novo.",
};

export function GoogleCard({
  connected,
  failed,
  errorCode,
}: {
  connected: boolean;
  failed: boolean;
  errorCode?: string;
}) {
  const [pending, setPending] = useState(false);

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
    // Sem erro: o navegador segue para o Google; o botão continua em carregamento.
  }

  const btn = "min-h-11 shrink-0 rounded-full px-4 text-sm font-bold disabled:opacity-60";
  let hint = "Conecte para os agendamentos aparecerem no seu calendário do Google.";
  if (connected) hint = "Conectado. Os agendamentos vão para o seu calendário.";
  if (failed) {
    const known = errorCode ? ERROR_HINTS[errorCode.toLowerCase()] : undefined;
    hint =
      known ??
      `Não deu para conectar. Tente de novo e aceite o acesso à agenda.${errorCode ? ` (código: ${errorCode})` : ""}`;
  }

  return (
    <div className="flex items-center justify-between gap-3 glass rounded-[1.75rem] px-5 py-4">
      <div>
        <p className="font-bold">Google Agenda</p>
        <p className={`text-sm font-semibold ${failed ? "text-fail" : "text-muted"}`}>{hint}</p>
      </div>
      <button
        type="button"
        onClick={connect}
        disabled={pending}
        aria-busy={pending}
        className={`${btn} ${connected ? "btn-glass" : "btn-tint"}`}
      >
        {pending ? "Abrindo…" : connected ? "Reconectar" : "Conectar"}
      </button>
    </div>
  );
}
