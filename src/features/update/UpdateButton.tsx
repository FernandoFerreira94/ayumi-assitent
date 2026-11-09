"use client";

import { useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { notify } from "@/components/feedback/toast";
import { fetchServerBuild } from "@/lib/update-check";

const CURRENT = process.env.NEXT_PUBLIC_BUILD_ID ?? "";

/** Limpa o service worker e o cache do app e recarrega para pegar a versão nova. */
async function applyUpdate() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch {}
  window.location.reload();
}

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
    </div>
  );
}
