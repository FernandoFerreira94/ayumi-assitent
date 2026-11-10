"use client";

import { useRef, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { buildShareText } from "./share-text";

type Day = { date: string; label: string; slots: string[] };

/**
 * "Copiar texto para divulgar": abre um diálogo com os dias que têm vaga (todos marcados) para escolher
 * quais entram no texto, mostra a prévia e copia no formato do WhatsApp.
 */
export function ShareSheet({ serviceName, days }: { serviceName: string; days: Day[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const chosen = days.filter((d) => !off.has(d.date));
  const text = buildShareText(serviceName, chosen);
  const close = () => ref.current?.close();
  const toggle = (date: string) =>
    setOff((s) => {
      const n = new Set(s);
      if (n.has(date)) n.delete(date);
      else n.add(date);
      return n;
    });

  async function copy() {
    if (!text || busy) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Texto copiado", "Cole no WhatsApp ou no Instagram.");
      close();
    } catch {
      notify.error("UNKNOWN", copy);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpened(true);
          ref.current?.showModal();
        }}
        className="btn-tint flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-5 font-bold"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="3" />
          <path d="M15.5 8.5V6.5a2.5 2.5 0 0 0-2.5-2.5H6.5A2.5 2.5 0 0 0 4 6.5V13a2.5 2.5 0 0 0 2.5 2.5h2" />
        </svg>
        Copiar texto para divulgar
      </button>
      <dialog
        ref={ref}
        aria-label="Texto para divulgar"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="notif-dialog"
      >
        <div className="status-fill" aria-hidden="true" />
        {opened ? (
          <div className="notif-panel grid max-h-[min(86dvh,720px)] w-[min(92vw,400px)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Texto para divulgar</h2>
                <p className="text-sm font-semibold text-muted">Escolha os dias que entram no texto.</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="btn-glass grid size-11 shrink-0 place-content-center rounded-full"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Dias">
              {days.map((d) => {
                const on = !off.has(d.date);
                return (
                  <li key={d.date}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(d.date)}
                      className={`min-h-11 rounded-full px-4 text-sm font-bold ${on ? "btn-tint" : "btn-glass"}`}
                    >
                      {d.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="overflow-y-auto">
              {text ? (
                <pre className="whitespace-pre-wrap rounded-2xl bg-white/60 px-4 py-3 font-sans text-sm font-semibold">
                  {text}
                </pre>
              ) : (
                <p className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold text-muted">
                  Marque pelo menos um dia para gerar o texto.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={copy}
              disabled={!text || busy}
              aria-busy={busy}
              className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold disabled:opacity-60"
            >
              {busy ? <span className="spin" aria-hidden="true" /> : null}
              {busy ? "Copiando…" : "Copiar texto"}
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
