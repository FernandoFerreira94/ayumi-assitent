"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle, type IconName, type Tint } from "@/components/ui/Icon";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { buildShareBody, composeShareText, markKey, shareFooters, shareTitles, type ShareFormat } from "./share-text";

type Day = { date: string; label: string; slots: string[] };

const DEFAULT_TAG = "blindagem";
const FORMATS: [ShareFormat, string][] = [
  ["padrao", "Padrão"],
  ["agenda", "Agenda aberta"],
];

const toggleIn = (set: Set<string>, key: string) => {
  const n = new Set(set);
  if (n.has(key)) n.delete(key);
  else n.add(key);
  return n;
};

/** Cartão de uma parte do texto: quadradinho com desenho, título e ação à direita (ex.: "Refazer"). */
export function Part({
  icon,
  tint,
  title,
  action,
  children,
}: {
  icon: IconName;
  tint: Tint;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2.5 rounded-2xl bg-white/60 p-3.5">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <TileTitle icon={icon} tint={tint}>
          {title}
        </TileTitle>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Sugestões prontas: um toque troca o campo pela referência; a dona ajusta depois se quiser. */
function Suggestions({ items, current, onPick }: { items: string[]; current: string; onPick: (v: string) => void }) {
  return (
    <ul className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-0.5" aria-label="Sugestões">
      {items.map((item) => (
        <li key={item} className="shrink-0">
          <button
            type="button"
            aria-pressed={item === current}
            onClick={() => onPick(item)}
            className={`min-h-11 max-w-60 truncate rounded-full px-3.5 text-sm font-bold ${item === current ? "btn-tint" : "btn-glass"}`}
          >
            {item.split("\n")[0]}
            {item.includes("\n") ? " + legenda" : ""}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-bold text-primary-text"
    >
      <Icon name="refresh" size={16} />
      Refazer
    </button>
  );
}

/**
 * "Copiar texto para divulgar": diálogo com formato, dias e o texto em três partes editáveis
 * (título, horários e rodapé), cada uma com sugestões prontas, e a prévia do que vai ser copiado.
 */
export function ShareSheet({
  serviceName,
  days,
  defaultOpen = false,
  onClose,
}: {
  serviceName: string;
  days: Day[];
  /** Já abre o diálogo e esconde o botão (usado pela lista personalizada). */
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ShareFormat>("padrao");
  const [off, setOff] = useState<Set<string>>(new Set());
  /** Horários marcados como exclusivos (só no texto) e o rótulo que aparece ao lado. */
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [tag, setTag] = useState(DEFAULT_TAG);
  /** Partes editadas à mão; null = usa a sugestão/geração automática. */
  const [title, setTitle] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [footer, setFooter] = useState<string | null>(null);
  const keyboard = useKeyboardInset(opened);

  const chosen = days.filter((d) => !off.has(d.date));
  const marks = { tag: tag.trim() || DEFAULT_TAG, keys: marked };
  const titles = shareTitles(format, serviceName, chosen);
  const footers = shareFooters(format, marks);
  const generatedBody = buildShareBody(chosen, format, marks);
  const titleText = title ?? titles[0];
  const bodyText = body ?? generatedBody;
  const footerText = footer ?? footers[0];
  const text = composeShareText(titleText, bodyText, footerText);
  const close = () => ref.current?.close();

  useEffect(() => {
    if (defaultOpen && ref.current && !ref.current.open) ref.current.showModal();
  }, [defaultOpen]);

  function pickFormat(f: ShareFormat) {
    setFormat(f);
    setTitle(null);
    setBody(null);
    setFooter(null);
  }

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
      {defaultOpen ? null : (
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
      )}
      <dialog
        ref={ref}
        aria-label="Texto para divulgar"
        onClose={onClose}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="notif-dialog"
      >
        <div className="status-fill" aria-hidden="true" />
        {opened ? (
          <div
            style={keyboard}
            className="notif-panel grid max-h-[min(88dvh,760px)] w-[min(94vw,420px)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Texto para divulgar</h2>
                <p className="text-sm font-semibold text-muted">Toque numa sugestão ou escreva do seu jeito.</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="btn-glass grid size-11 shrink-0 place-content-center rounded-full"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="-mx-1 grid content-start gap-3 overflow-y-auto overscroll-contain px-1 pb-1">
              <div
                role="group"
                aria-label="Formato do texto"
                className="grid grid-cols-2 gap-1 rounded-full bg-white/60 p-1"
              >
                {FORMATS.map(([value, name]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={format === value}
                    onClick={() => pickFormat(value)}
                    className={`min-h-11 rounded-full px-3 text-sm font-bold ${format === value ? "btn-tint" : "text-muted"}`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <ul className="flex flex-wrap gap-2" aria-label="Dias que entram no texto">
                {days.map((d) => {
                  const on = !off.has(d.date);
                  return (
                    <li key={d.date}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setBody(null);
                          setOff((s) => toggleIn(s, d.date));
                        }}
                        className={`flex min-h-11 items-center gap-1 rounded-full px-3.5 text-sm font-bold ${on ? "btn-tint" : "btn-glass text-muted"}`}
                      >
                        {on ? <Icon name="check" size={16} /> : null}
                        {d.label}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {generatedBody ? (
                <>
                  <Part
                    icon="sparkles"
                    tint="lavender"
                    title="Título"
                    action={title !== null ? <ResetButton onClick={() => setTitle(null)} /> : null}
                  >
                    <input
                      value={titleText}
                      onChange={(e) => setTitle(e.target.value)}
                      aria-label="Título do texto"
                      placeholder="Ex.: Agenda aberta"
                      className="min-h-12 w-full rounded-xl border px-3.5 text-base font-semibold"
                    />
                    <Suggestions items={titles} current={titleText} onPick={setTitle} />
                  </Part>

                  <Part
                    icon="clock"
                    tint="blue"
                    title="Horários"
                    action={body !== null ? <ResetButton onClick={() => setBody(null)} /> : null}
                  >
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBody(e.target.value)}
                      aria-label="Horários do texto"
                      rows={Math.min(12, Math.max(4, bodyText.split("\n").length))}
                      className="w-full resize-none rounded-xl border px-3.5 py-3 font-sans text-base font-semibold leading-snug"
                    />
                    {format === "agenda" ? (
                      <details className="group rounded-xl bg-white/70 px-3">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold">
                          <span>
                            Marcar horários exclusivos
                            {marked.size ? ` · ${marked.size}` : ""}
                          </span>
                          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-90">
                            ›
                          </span>
                        </summary>
                        <p className="pb-2 text-xs font-semibold text-muted">
                          Toque nos horários que são só para um procedimento. Eles saem com o rótulo ao lado.
                        </p>
                        <label className="flex items-center gap-2 pb-3 text-sm font-bold">
                          Rótulo
                          <input
                            value={tag}
                            onChange={(e) => {
                              setTag(e.target.value);
                              setBody(null);
                            }}
                            maxLength={30}
                            className="min-h-11 min-w-0 flex-1 rounded-xl border px-3 text-base font-semibold"
                          />
                        </label>
                        <div className="grid gap-3 pb-3">
                          {chosen.map((d) => (
                            <div key={d.date}>
                              <p className="pb-1.5 text-xs font-bold text-muted">{d.label}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {d.slots.map((t) => {
                                  const key = markKey(d.date, t);
                                  const on = marked.has(key);
                                  return (
                                    <button
                                      key={t}
                                      type="button"
                                      aria-pressed={on}
                                      onClick={() => {
                                        setBody(null);
                                        setMarked((s) => toggleIn(s, key));
                                      }}
                                      className={`min-h-11 rounded-full px-3 text-sm font-bold ${on ? "btn-tint" : "btn-glass"}`}
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
                  </Part>

                  <Part
                    icon="message"
                    tint="pink"
                    title="Rodapé"
                    action={footer !== null ? <ResetButton onClick={() => setFooter(null)} /> : null}
                  >
                    <textarea
                      value={footerText}
                      onChange={(e) => setFooter(e.target.value)}
                      aria-label="Rodapé do texto"
                      placeholder="Ex.: Qual prefere?"
                      rows={Math.min(6, Math.max(2, footerText.split("\n").length + 1))}
                      className="w-full resize-none rounded-xl border px-3.5 py-3 font-sans text-base font-semibold leading-snug"
                    />
                    <Suggestions items={footers} current={footerText} onPick={setFooter} />
                  </Part>

                  <Part icon="chat" tint="green" title="Prévia">
                    <p className="whitespace-pre-wrap rounded-2xl rounded-tl-md bg-chat-out px-4 py-3 text-sm font-semibold leading-snug text-fg shadow-[0_1px_2px_rgba(23,20,43,0.12)]">
                      {text}
                    </p>
                  </Part>
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
