"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Fica no fim do menu, em rosa, e pede confirmação antes de sair. */
export function SignOutButton() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="flex min-h-11 items-center gap-3 rounded-2xl px-2.5 text-[15px] font-bold text-fail"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
        </svg>
        Sair da conta
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label="Confirmar saída" className="grid w-full gap-2 rounded-2xl border border-line bg-surface p-3">
      <p className="text-sm font-semibold text-muted">Sair da conta? Para voltar, você entra de novo com o Google ou o e-mail.</p>
      <div className="flex gap-2">
        <button
          type="button"
          // Foco no Cancelar: o toque acidental no Sair da conta não sai sozinho
          autoFocus
          onClick={() => setAsking(false)}
          className="min-h-11 flex-1 rounded-full border border-line bg-surface font-bold"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await authClient.signOut();
            router.replace("/login");
            router.refresh();
          }}
          className="min-h-11 flex-1 rounded-full bg-fail font-bold text-white disabled:opacity-60"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
