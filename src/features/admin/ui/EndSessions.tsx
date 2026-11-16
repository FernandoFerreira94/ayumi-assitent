"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { ERROR_MESSAGES, messageFor } from "@/lib/errors";
import { endOtherSessions } from "../actions";

/** Encerra as sessões dos outros aparelhos (com o acesso valendo 7 dias, é o botão de "perdi o celular"). */
export function EndSessions({ others }: { others: number }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);

  if (others === 0) {
    return <p className="text-sm font-semibold text-muted">Você só está conectado neste aparelho.</p>;
  }

  async function run() {
    setPending(true);
    try {
      const r = await endOtherSessions();
      if (!r.ok) {
        notify.problem(messageFor(r.code));
        return;
      }
      notify.success("Outros aparelhos desconectados", `${r.data.ended} ${r.data.ended === 1 ? "sessão encerrada" : "sessões encerradas"}.`);
      setAsking(false);
      router.refresh();
    } catch {
      notify.problem(ERROR_MESSAGES.NETWORK);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold">
        Sua conta está aberta em mais {others} {others === 1 ? "aparelho ou navegador" : "aparelhos ou navegadores"}. Isso
        inclui o app do salão.
      </p>
      {asking ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setAsking(false)} className="btn-glass min-h-12 rounded-2xl px-5 font-bold">
            Cancelar
          </button>
          <SubmitButton type="button" pending={pending} pendingLabel="Encerrando…" onClick={run}>
            Desconectar os outros
          </SubmitButton>
        </div>
      ) : (
        <button type="button" onClick={() => setAsking(true)} className="btn-glass min-h-12 rounded-2xl px-5 font-bold">
          Desconectar outros aparelhos
        </button>
      )}
    </div>
  );
}
