"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Drawer } from "vaul";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { formatTime } from "@/lib/dates";
import { sendClientMessage } from "./actions";
import { MAX_MESSAGE } from "./send";

type Bubble = { id: number; text: string; at: Date; state: "sending" | "sent" | { failed: ErrorCode } };

/** Visual do botão que abre a conversa, igual na agenda e onde mais aparecer. */
export const CHAT_BUTTON = "btn-glass inline-flex items-center justify-center gap-2";

/** Balão de conversa em verde de chat; não é o logo do WhatsApp, que é marca de terceiros. */
export function ChatGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px] text-chat-send"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5 5.3 16A8 8 0 1 1 8 18.7Z" />
      <path d="M9 11h6M9 14h3.5" />
    </svg>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/**
 * Folha no estilo da conversa do WhatsApp para escrever a uma cliente pelo WhatsApp do salão.
 * Mostra o que foi enviado nesta visita à tela (o app ainda não guarda o histórico de conversas).
 * `nested` quando abre de dentro de outra folha (as ações do agendamento).
 */
export function ChatSheet({
  clientId,
  clientName,
  phone,
  nested = false,
  triggerClassName,
  children,
}: {
  clientId: string;
  clientName: string;
  /** Já formatado para exibir, ex.: (11) 98765-4321. */
  phone: string;
  nested?: boolean;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [text, setText] = useState("");
  const seq = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;

  async function deliver(id: number, body: string) {
    const patch = (state: Bubble["state"]) => setBubbles((bs) => bs.map((b) => (b.id === id ? { ...b, state } : b)));
    patch("sending");
    const res = await sendClientMessage(clientId, body).catch(() => null);
    patch(res?.ok ? "sent" : { failed: res && !res.ok ? res.code : "NETWORK" });
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const id = ++seq.current;
    setBubbles((bs) => [...bs, { id, text: body, at: new Date(), state: "sending" }]);
    setText("");
    requestAnimationFrame(() => end.current?.scrollIntoView({ block: "end" }));
    void deliver(id, body);
  }

  return (
    <Root>
      <Drawer.Trigger className={triggerClassName}>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85dvh] max-w-[520px] flex-col overflow-hidden rounded-t-3xl bg-chat-bg outline-none">
          <header className="sheet flex items-center gap-3 px-4 pb-3 pt-2">
            <span
              className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-line"
              aria-hidden="true"
            />
            <span
              className="mt-2 grid size-11 shrink-0 place-content-center rounded-full bg-soft font-bold text-primary-text"
              aria-hidden="true"
            >
              {initials(clientName)}
            </span>
            <div className="mt-2 min-w-0">
              <Drawer.Title className="truncate font-bold leading-5">{clientName}</Drawer.Title>
              <Drawer.Description className="text-xs font-semibold text-muted">
                {phone} · pelo WhatsApp do salão
              </Drawer.Description>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4" aria-live="polite">
            <p className="mx-auto mb-2 max-w-[34ch] rounded-lg bg-surface/80 px-3 py-1.5 text-center text-xs font-semibold text-muted">
              As mensagens saem do WhatsApp conectado em Ajustes, como se você mandasse pelo celular.
            </p>
            {bubbles.map((b) => (
              <div key={b.id} className="grid max-w-[82%] justify-items-end gap-1 self-end">
                <p className="whitespace-pre-wrap break-words rounded-xl rounded-tr-sm bg-chat-out px-3 pb-1 pt-1.5 text-[15px] leading-5 shadow-sm">
                  {b.text}
                  <span className="float-right ml-2 mt-1.5 flex translate-y-0.5 items-center gap-0.5 text-[11px] font-semibold tabular-nums text-muted">
                    {formatTime(b.at)}
                    <Status state={b.state} />
                  </span>
                </p>
                {typeof b.state === "object" ? (
                  <p role="alert" className="text-right text-xs font-semibold text-fail">
                    Não enviada. {messageFor(b.state.failed)}{" "}
                    {b.state.failed === "WHATSAPP_OFFLINE" ? (
                      <Link href="/ajustes#whatsapp" className="font-bold underline">
                        Reconectar
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deliver(b.id, b.text)}
                        className="min-h-6 font-bold underline"
                      >
                        Tentar de novo
                      </button>
                    )}
                  </p>
                ) : null}
              </div>
            ))}
            <div ref={end} />
          </div>

          <form onSubmit={send} className="flex items-end gap-2 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Cresce com o texto até umas 5 linhas, como o campo do WhatsApp
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              rows={1}
              maxLength={MAX_MESSAGE}
              aria-label={`Mensagem para ${clientName}`}
              placeholder="Mensagem"
              className="min-h-11 flex-1 resize-none rounded-3xl bg-surface px-4 py-2.5 text-base leading-6 shadow-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Enviar"
              className="grid size-11 shrink-0 place-content-center rounded-full bg-chat-send text-white shadow-sm transition-transform active:scale-95 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                <path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" />
              </svg>
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}

function Status({ state }: { state: Bubble["state"] }) {
  if (state === "sending")
    return (
      <svg
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        role="img"
        aria-label="Enviando"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.5V8l2.2 1.4" />
      </svg>
    );
  // Um tique só: a Evolution confirma que saiu, não que a cliente recebeu ou leu
  if (state === "sent")
    return (
      <svg
        viewBox="0 0 12 12"
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Enviada"
      >
        <path d="M1.5 6.5 4.5 9.5 10.5 2.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 text-fail" fill="currentColor" role="img" aria-label="Não enviada">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 4.2v4.6M8 11.3v.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
