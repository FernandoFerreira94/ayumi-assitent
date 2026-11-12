"use client";

import { useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { notify } from "@/components/feedback/toast";
import { applyUpdate, fetchServerBuild } from "@/lib/update-check";
import { ChangeList } from "./ChangeList";
import { RELEASES, releaseDate } from "./changelog";

const CURRENT = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
/** Quantas versões aparecem no accordion. */
const SHOWN = 4;

/** Atualização manual: só acontece quando a pessoa toca no botão. */
export function UpdateButton() {
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    const server = await fetchServerBuild();
    if (!server) {
      setBusy(false);
      return notify.error("NETWORK", check);
    }
    if (server === CURRENT) {
      setBusy(false);
      return notify.success("Você já está na versão mais recente");
    }
    notify.info("Nova versão encontrada", "Atualizando…");
    await applyUpdate();
  }

  return (
    <div className="glass grid gap-3 rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center gap-3">
        <Mascot size={52} className="shrink-0" />
        <div className="min-w-0">
          <p className="font-bold">Atualização do app</p>
          <p className="text-sm font-semibold text-muted">Toque para ver se há uma versão nova e atualizar.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={check}
        disabled={busy}
        aria-busy={busy}
        className="btn-tint min-h-12 rounded-full px-4 font-bold disabled:opacity-60"
      >
        {busy ? "Verificando…" : "Verificar atualização"}
      </button>
      <div className="grid gap-2" aria-label="O que mudou no app">
        {RELEASES.slice(0, SHOWN).map((release, i) => (
          <details key={release.version} open={i === 0} className="group rounded-2xl bg-white/70 px-4 py-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block font-bold">
                  {i === 0 ? "O que mudou" : `Versão ${release.version}`}
                  {i === 0 ? <span className="font-semibold text-muted"> · versão {release.version}</span> : null}
                </span>
                <span className="block text-sm font-semibold text-muted">
                  {release.title} · {releaseDate(release.date)}
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="pb-1 pt-2">
              <ChangeList release={release} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
