"use client";

import { useRef, useState } from "react";
import { signOutAndReload } from "./SignOutButton";

/**
 * "Sair da conta" no pé do menu lateral (tablet e desktop, app e /admin). No celular quem sai é o menu do avatar
 * (SignOutButton). Pede confirmação num diálogo no meio da tela, com o foco no Cancelar.
 */
export function SideNavSignOut() {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        title="Sair da conta"
        onClick={() => ref.current?.showModal()}
        className="sidenav-link sidenav-signout"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="sidenav-icon"
        >
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
        </svg>
        <span className="sr-only xl:not-sr-only xl:flex-1 xl:text-left">Sair da conta</span>
      </button>
      <dialog
        ref={ref}
        aria-labelledby="sidenav-signout-title"
        onClick={(e) => {
          if (e.target === e.currentTarget && !busy) close();
        }}
        className="notif-dialog"
      >
        <div className="notif-panel grid w-[min(92vw,380px)] gap-4 rounded-[28px] p-6">
          <div className="grid gap-1">
            <h2 id="sidenav-signout-title" className="text-xl font-bold">
              Sair da conta?
            </h2>
            <p className="text-[15px] font-semibold text-muted">
              Para voltar, você entra de novo com o Google ou o e-mail.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              // Foco no Cancelar: Enter sem querer não sai da conta
              autoFocus
              onClick={close}
              className="min-h-11 flex-1 rounded-full border border-line bg-surface font-bold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                if (!(await signOutAndReload())) setBusy(false);
              }}
              className="min-h-11 flex-1 rounded-full bg-fail font-bold text-white disabled:opacity-60"
            >
              {busy ? "Saindo…" : "Sair"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
