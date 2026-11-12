"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { ChangeList } from "./ChangeList";
import { CURRENT_RELEASE, CURRENT_VERSION, releaseDate, SEEN_VERSION_KEY } from "./changelog";

/**
 * Diálogo central "App atualizado": abre uma vez por versão, por aparelho, depois que o app carrega já na versão
 * nova (a atualização recarrega a página). Não abre durante o tour. Sem localStorage, simplesmente não abre.
 */
export function WhatsNewDialog({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (localStorage.getItem(SEEN_VERSION_KEY) === CURRENT_VERSION) return;
    } catch {
      return;
    }
    void Promise.resolve().then(() => setOpened(true));
  }, [enabled]);

  useEffect(() => {
    if (opened && !ref.current?.open) ref.current?.showModal();
  }, [opened]);

  function close() {
    try {
      localStorage.setItem(SEEN_VERSION_KEY, CURRENT_VERSION);
    } catch {}
    ref.current?.close();
    setOpened(false);
  }

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
      {opened ? (
        <div className="notif-panel grid max-h-[min(78dvh,640px)] w-[min(92vw,400px)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <Mascot size={52} className="shrink-0" />
            <div className="min-w-0">
              <h2 id="whats-new-title" className="text-xl font-bold">
                App atualizado
              </h2>
              <p className="text-sm font-semibold text-muted">
                Versão {CURRENT_VERSION} · {releaseDate(CURRENT_RELEASE.date)}
              </p>
            </div>
          </div>
          <div className="-mx-1 grid content-start gap-3 overflow-y-auto px-1">
            <p className="font-bold">{CURRENT_RELEASE.title}</p>
            <ChangeList release={CURRENT_RELEASE} />
          </div>
          <button type="button" onClick={close} className="btn-tint min-h-12 rounded-full px-4 font-bold">
            Entendi
          </button>
        </div>
      ) : null}
    </dialog>
  );
}
