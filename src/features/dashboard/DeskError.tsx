"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BOX } from "./ui";

/** Caixa do Painel que não carregou: avisa e deixa tentar de novo sem perder o resto da tela. */
export function DeskError({ what }: { what: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role="alert" className={`${BOX} flex items-center gap-3`}>
      <p className="min-w-0 flex-1 text-sm font-semibold text-muted">Não deu para carregar {what}.</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => router.refresh())}
        className="btn-glass min-h-10 rounded-full px-4 text-sm font-bold disabled:opacity-60"
      >
        {pending ? "Carregando…" : "Tentar de novo"}
      </button>
    </div>
  );
}
