"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { ChangeList } from "./ChangeList";
import { CURRENT_VERSION, type Release, releaseDate, SEEN_VERSION_KEY, unseenReleases } from "./changelog";

/**
 * Diálogo "App atualizado": abre no Painel depois que o app carrega numa versão nova (o botão de atualizar leva ao
 * Painel). Lista as versões que este aparelho ainda não viu, cada uma num accordion fechado (título por fora,
 * detalhes por dentro). Uma vez por versão, por aparelho; não abre durante o tour. Sem localStorage, não abre.
 */
export function WhatsNewDialog({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const [releases, setReleases] = useState<readonly Release[] | null>(null);

  useEffect(() => {
    if (!enabled || pathname !== "/agenda" || releases) return;
    let seen: string | null;
    try {
      seen = localStorage.getItem(SEEN_VERSION_KEY);
    } catch {
      return;
    }
    const list = unseenReleases(seen);
    if (list.length) void Promise.resolve().then(() => setReleases(list));
  }, [enabled, pathname, releases]);

  // Só abre com novidades. Depois do "Entendi" a lista fica vazia ([]), que é truthy: checar o tamanho evita
  // reabrir o diálogo vazio (só o fundo borrado, preso sobre o Painel).
  useEffect(() => {
    const dialog = ref.current;
    if (releases?.length && dialog && !dialog.open) dialog.showModal();
  }, [releases]);

  function close() {
    try {
      localStorage.setItem(SEEN_VERSION_KEY, CURRENT_VERSION);
    } catch {}
    setReleases([]);
    if (ref.current?.open) ref.current.close();
  }

  const open = !!releases?.length;
  return (
    <dialog
      ref={ref}
      aria-labelledby="whats-new-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="notif-dialog"
    >
      <div className="status-fill" aria-hidden="true" />
      {open ? (
        <div className="notif-panel grid max-h-[min(78dvh,640px)] w-[min(92vw,400px)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <Mascot size={52} className="shrink-0" />
            <div className="min-w-0">
              <h2 id="whats-new-title" className="text-xl font-bold">
                App atualizado
              </h2>
              <p className="text-sm font-semibold text-muted">Versão {CURRENT_VERSION} · toque para ver os detalhes</p>
            </div>
          </div>
          <div className="-mx-1 grid content-start gap-2 overflow-y-auto px-1" aria-label="O que mudou no app">
            {releases!.map((release) => (
              <details key={release.version} className="group rounded-2xl bg-white/70 px-4 py-2">
                <summary className="flex min-h-11 cursor-pointer rounded-xl list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="block font-bold leading-tight">{release.title}</span>
                    <span className="block text-xs font-semibold text-muted">
                      Versão {release.version} · {releaseDate(release.date)}
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
                <div className="pb-2 pt-1">
                  <ChangeList release={release} />
                </div>
              </details>
            ))}
          </div>
          <button type="button" onClick={close} className="btn-tint min-h-12 rounded-full px-4 font-bold">
            Entendi
          </button>
        </div>
      ) : null}
    </dialog>
  );
}
