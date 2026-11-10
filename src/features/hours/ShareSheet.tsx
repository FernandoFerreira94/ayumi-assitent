"use client";

import { useRef, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { buildShareText, markKey, type ShareFormat } from "./share-text";

type Day = { date: string; label: string; slots: string[] };

const DEFAULT_TAG = "blindagem";

/**
 * "Copiar texto para divulgar": abre um diálogo com os dias que têm vaga (todos marcados) para escolher
 * quais entram no texto, escolher o formato, editar o texto à mão e copiar.
 */
export function ShareSheet({ serviceName, days }: { serviceName: string; days: Day[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ShareFormat>("padrao");
  /** Texto editado à mão; null = usa o gerado. Trocar dia ou formato refaz o texto. */
  const [custom, setCustom] = useState<string | null>(null);
  const keyboard = useKeyboardInset(opened);
  /** Horários marcados como exclusivos (só no texto) e o rótulo que aparece ao lado. */
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [tag, setTag] = useState(DEFAULT_TAG);

  const chosen = days.filter((d) => !off.has(d.date));
  const generated = buildShareText(serviceName, chosen, format, {
    tag: tag.trim() || DEFAULT_TAG,
    keys: marked,
  });
  const text = custom ?? generated;
  const close = () => ref.current?.close();
  const toggle = (date: string) => {
    setCustom(null);
    setOff((s) => {
      const n = new Set(s);
      if (n.has(date)) n.delete(date);
      else n.add(date);
      return n;
    });
  };

  const toggleMark = (key: string) => {
    setCustom(null);
    setMarked((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  async function copy() {
    if (!text.trim() || busy) return;
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
          <div
            style={keyboard}
            className="notif-panel grid max-h-[min(86dvh,720px)] w-[min(92vw,400px)] grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Texto para divulgar</h2>
                <p className="text-sm font-semibold text-muted">Escolha os dias, o formato e ajuste o texto.</p>
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
            <div className="grid gap-3">
              <div role="group" aria-label="Formato do texto" className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["padrao", "Padrão"],
                    ["agenda", "Agenda aberta"],
                  ] as const
                ).map(([value, name]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={format === value}
                    onClick={() => {
                      setFormat(value);
                      setCustom(null);
                    }}
                    className={`min-h-11 rounded-full px-3 text-sm font-bold ${format === value ? "btn-tint" : "btn-glass"}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {format === "agenda" ? (
                <details className="rounded-2xl bg-white/60 px-4 py-2">
                  <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold">
                    Marcar horários exclusivos
                    {marked.size ? ` (${marked.size})` : ""}
                  </summary>
                  <label className="flex items-center gap-2 pb-2 text-sm font-semibold">
                    Rótulo
                    <input
                      value={tag}
                      onChange={(e) => {
                        setTag(e.target.value);
                        setCustom(null);
                      }}
                      maxLength={30}
                      className="min-h-11 min-w-0 flex-1 rounded-xl border px-3 text-base"
                    />
                  </label>
                  <div className="grid max-h-48 gap-2 overflow-y-auto pb-2">
                    {chosen.map((d) => (
                      <div key={d.date}>
                        <p className="pb-1 text-xs font-bold text-muted">{d.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.slots.map((t) => {
                            const key = markKey(d.date, t);
                            return (
                              <button
                                key={t}
                                type="button"
                                aria-pressed={marked.has(key)}
                                onClick={() => toggleMark(key)}
                                className={`min-h-11 rounded-full px-3 text-sm font-bold ${marked.has(key) ? "btn-tint" : "btn-glass"}`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
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
            <div className="flex min-h-0 flex-col gap-2">
              {generated ? (
                <>
                  <textarea
                    value={text}
                    onChange={(e) => setCustom(e.target.value)}
                    aria-label="Texto para divulgar (editável)"
                    className="min-h-40 w-full flex-1 resize-none rounded-2xl border px-4 py-3 font-sans text-base font-semibold"
                  />
                  {custom !== null ? (
                    <button
                      type="button"
                      onClick={() => setCustom(null)}
                      className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold"
                    >
                      Refazer texto
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold text-muted">
                  Marque pelo menos um dia para gerar o texto.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={copy}
              disabled={!text.trim() || busy}
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
