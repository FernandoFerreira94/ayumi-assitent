"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { refreshAgenda } from "./actions";

/**
 * Botão "Atualizar" pequeno (Calendário e Painel): traz agora os eventos do Google/iPhone e recarrega os dados
 * da tela, sem recarregar a página. O ícone gira enquanto carrega; o toque pega 44px mesmo com o ícone pequeno.
 */
export function RefreshButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [pending, start] = useTransition();
  const busy = syncing || pending;

  const run = async () => {
    if (busy) return;
    setSyncing(true);
    const res = await refreshAgenda().catch(() => null);
    setSyncing(false);
    if (!res?.ok) {
      notify.error(res ? res.code : "NETWORK", run);
      return;
    }
    start(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      aria-busy={busy}
      aria-label={busy ? "Atualizando a agenda" : "Atualizar a agenda"}
      className={`grid size-11 shrink-0 place-items-center rounded-full text-primary-text transition-opacity active:opacity-60 disabled:opacity-100 ${className}`}
    >
      <span className="btn-glass grid size-8 place-items-center rounded-full">
        <Icon
          name="refresh"
          size={16}
          className={busy ? "animate-spin motion-reduce:[animation-duration:3s]" : undefined}
        />
      </span>
    </button>
  );
}
