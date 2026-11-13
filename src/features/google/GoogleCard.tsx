"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notify } from "@/components/feedback/toast";
import { authClient } from "@/lib/auth-client";
import { TileTitle } from "@/components/ui/Icon";
import { disconnectGoogle } from "./actions";
import { CreatePasswordSheet } from "./CreatePasswordSheet";
import { Switch } from "@/components/ui/Switch";

/**
 * Liga a conta Google à conta do app para os agendamentos irem para o Google Agenda.
 * Interruptor ligado = conectado (não há "Reconectar": o acesso se renova sozinho). Ligar abre o Google;
 * desligar pergunta antes e desfaz o vínculo. Se o Google for a única entrada no app, o próprio aviso
 * oferece "Criar senha" (sheet) e, criada a senha, o desconectar volta a funcionar.
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
  email,
}: {
  connected: boolean;
  failed: boolean;
  errorCode?: string;
  /** E-mail de login: mostrado ao criar a senha e salvo pelo iPhone junto com ela. */
  email?: string;
}) {
  const router = useRouter();
  const [connected, setConnected] = useState(initialConnected);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  /** O Google é a única entrada: o aviso troca para "crie uma senha". */
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  async function connect() {
    setPending(true);
    const { error } = await authClient.linkSocial({
      provider: "google",
      callbackURL: "/ajustes/calendarios",
      errorCallbackURL: "/ajustes/calendarios?google=erro",
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
      if (res?.code === "VALIDATION") setNeedsPassword(true);
      else notify.error(res ? res.code : "NETWORK", () => void disconnect());
      return;
    }
    setConfirming(false);
    setConnected(false);
    notify.success("Google Agenda desconectado");
    router.refresh();
  }

  function cancel() {
    setConfirming(false);
    setNeedsPassword(false);
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

  // Fica montado em todos os estados: se sumisse junto com o aviso, o vaul fecharia sem animar e sem limpar a tela.
  const sheet = (
    <CreatePasswordSheet
      open={passwordOpen}
      onOpenChange={setPasswordOpen}
      email={email}
      onCreated={() => setNeedsPassword(false)}
    />
  );

  if (confirming && needsPassword)
    return (
      <>
        <div
          className="glass grid gap-3 rounded-[1.75rem] px-5 py-4"
          role="alertdialog"
          aria-label="Crie uma senha antes de desconectar"
        >
          <div>
            <p className="font-bold">Crie uma senha antes de desconectar</p>
            <p className="text-sm font-semibold text-muted">
              Hoje você entra no app só pelo Google. Crie uma senha para não perder o acesso; depois é só desconectar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold" onClick={cancel}>
              Agora não
            </button>
            <button
              type="button"
              className="btn-tint min-h-11 rounded-full px-4 text-sm font-bold"
              onClick={() => setPasswordOpen(true)}
              autoFocus
            >
              Criar senha
            </button>
          </div>
        </div>
        {sheet}
      </>
    );

  if (confirming)
    return (
      <>
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
              onClick={cancel}
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
        {sheet}
      </>
    );

  return (
    <>
      <div className="flex items-center justify-between gap-3 glass rounded-[1.75rem] px-5 py-4">
        <div>
          <TileTitle icon="calendar" tint="blue">
            Google Agenda
          </TileTitle>
          <p className={`text-sm font-semibold ${failed ? "text-fail" : "text-muted"}`}>{hint}</p>
        </div>
        <Switch checked={connected} onChange={toggle} busy={pending} label="Google Agenda" />
      </div>
      {sheet}
    </>
  );
}
