"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { agendaVersion } from "./actions";

/** De quanto em quanto tempo confere se a agenda mudou, com a tela aberta. */
const CHECK_MS = 30_000;

/**
 * Pílula "Atualizar" que aparece quando a agenda do dia mudou fora desta tela (outro aparelho,
 * cliente confirmando pelo WhatsApp). Atualiza só os dados, sem recarregar a página.
 * A página monta com `key={version}`: depois de atualizar, a versão nova remonta e esconde a pílula.
 */
export function AgendaRefresh({ date, version }: { date: string; version: string }) {
  const router = useRouter();
  const [stale, setStale] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (stale) return;
    let alive = true;
    const check = async () => {
      if (document.hidden) return;
      const res = await agendaVersion(date).catch(() => null);
      if (alive && res?.ok && res.data !== version) setStale(true);
    };
    const id = setInterval(check, CHECK_MS);
    // Voltou para o app (desbloqueou o celular, trocou de aba): confere na hora
    const onVisible = () => !document.hidden && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [date, version, stale]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-30 flex justify-center">
      {stale ? (
        <button
          type="button"
          onClick={() => start(() => router.refresh())}
          disabled={pending}
          className="btn-glass pointer-events-auto flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-primary-text shadow-lg"
        >
          {pending ? (
            <span className="spin" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
            </svg>
          )}
          {pending ? "Atualizando…" : "Agenda mudou · Atualizar"}
        </button>
      ) : null}
    </div>
  );
}
