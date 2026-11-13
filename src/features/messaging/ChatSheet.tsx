"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { formatTime, todayStr } from "@/lib/dates";
import { loadConversation, sendClientMessage } from "./actions";
import { MAX_MESSAGE } from "./send";
import type { ConversationMessage } from "./store";

/** Com a folha aberta, confere respostas novas nesse intervalo. */
const POLL_MS = 4000;

/** Só o que ainda não está no banco: enviando agora ou que falhou (com tentar de novo). */
type Local = { id: number; text: string; at: Date; state: "sending" | { failed: ErrorCode } };

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

const KIND_LABEL: Partial<Record<ConversationMessage["kind"], string>> = {
  reminder: "Lembrete automático",
  auto_reply: "Resposta automática",
  phone: "Pelo seu celular",
};
const INTENT_LABEL = { confirm: "Confirmou", cancel: "Cancelou", reschedule: "Quer remarcar" } as const;

function dayLabel(iso: string) {
  const day = todayStr(new Date(iso));
  const today = todayStr();
  if (day === today) return "Hoje";
  const y = new Date(`${today}T12:00:00Z`);
  y.setUTCDate(y.getUTCDate() - 1);
  if (day === y.toISOString().slice(0, 10)) return "Ontem";
  return `${day.slice(8)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
}

/**
 * Folha no estilo da conversa do WhatsApp com uma cliente: histórico guardado (o que a dona e os
 * lembretes mandaram e o que a cliente respondeu), atualizado a cada poucos segundos enquanto aberta.
 * `nested` quando abre de dentro de outra folha (as ações do agendamento).
 */
export function ChatSheet({
  clientId,
  clientName,
  phone,
  nested = false,
  triggerClassName,
  triggerLabel,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  clientId: string;
  clientName: string;
  /** Já formatado para exibir, ex.: (11) 98765-4321. */
  phone: string;
  nested?: boolean;
  triggerClassName?: string;
  /** Nome acessível quando o gatilho é só um ícone. */
  triggerLabel?: string;
  /** Sem gatilho (children), a folha é controlada de fora: abre pela notificação (ver ConversationHost). */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const side = useSheetSide();
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlledOpen ?? ownOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const [history, setHistory] = useState<ConversationMessage[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [locals, setLocals] = useState<Local[]>([]);
  const [text, setText] = useState("");
  const seq = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;

  async function refresh() {
    const res = await loadConversation(clientId).catch(() => null);
    if (res?.ok) {
      setHistory(res.data);
      setLoadFailed(false);
    } else setLoadFailed(true);
  }

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const tick = () => alive && !document.hidden && refresh();
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh só depende de clientId, que não muda com a folha aberta
  }, [open, clientId]);

  // Desce para a última mensagem quando chega ou sai uma nova
  const total = (history?.length ?? 0) + locals.length;
  useEffect(() => {
    if (total !== lastCount.current) end.current?.scrollIntoView({ block: "end" });
    lastCount.current = total;
  }, [total]);

  // Teclado abriu ou fechou: a última mensagem continua à vista logo acima do campo
  // (a folha sobe com o teclado pelo KeyboardWatcher + globals.css; aqui só espera a transição terminar)
  useEffect(() => {
    if (!open) return;
    end.current?.scrollIntoView({ block: "end" });
    const vv = window.visualViewport;
    if (!vv) return;
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => end.current?.scrollIntoView({ block: "end", behavior: "smooth" }), 340);
    };
    vv.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      vv.removeEventListener("resize", onResize);
    };
  }, [open]);

  async function deliver(id: number, body: string) {
    setLocals((ls) => ls.map((l) => (l.id === id ? { ...l, state: "sending" } : l)));
    const res = await sendClientMessage(clientId, body).catch(() => null);
    if (res?.ok) {
      await refresh();
      setLocals((ls) => ls.filter((l) => l.id !== id));
    } else {
      setLocals((ls) => ls.map((l) => (l.id === id ? { ...l, state: { failed: res && !res.ok ? res.code : "NETWORK" } } : l)));
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const id = ++seq.current;
    setLocals((ls) => [...ls, { id, text: body, at: new Date(), state: "sending" }]);
    setText("");
    void deliver(id, body);
  }

  return (
    <Root direction={side} open={open} onOpenChange={setOpen} repositionInputs={false}>
      {children ? (
        <Drawer.Trigger className={triggerClassName} aria-label={triggerLabel}>
          {children}
        </Drawer.Trigger>
      ) : null}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto h-[85dvh] max-w-[520px] rounded-t-3xl outline-none", "z-50 flex flex-col bg-chat-bg p-0! overflow-hidden!")}>
<SidePanelClose />
          <header className="sheet flex items-center gap-3 px-4 pb-3 pt-2">
            <span
              className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-line md:hidden"
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

          <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4" aria-live="polite" aria-busy={history === null}>
            <p className="mx-auto mb-2 max-w-[34ch] rounded-lg bg-surface/80 px-3 py-1.5 text-center text-xs font-semibold text-muted">
              As mensagens saem do WhatsApp conectado em Ajustes. As respostas da cliente aparecem aqui.
            </p>
            {history === null && !loadFailed ? <div className="skel mx-auto h-8 w-40 rounded-xl" aria-label="Carregando conversa" /> : null}
            {loadFailed && history === null ? (
              <p role="alert" className="text-center text-xs font-semibold text-fail">
                Não deu para carregar a conversa. Tentando de novo…
              </p>
            ) : null}
            {(history ?? []).map((m, i, all) => {
              const day = dayLabel(m.createdAt);
              // Separador de dia quando a mensagem anterior é de outro dia
              const sep = i === 0 || day !== dayLabel(all[i - 1].createdAt);
              const out = m.direction === "out";
              return (
                <div key={m.id} className="contents">
                  {sep ? <p className="mx-auto my-1 rounded-lg bg-surface/80 px-2.5 py-0.5 text-xs font-bold text-muted">{day}</p> : null}
                  <div className={`grid max-w-[82%] gap-0.5 ${out ? "justify-items-end self-end" : "justify-items-start self-start"}`}>
                    {KIND_LABEL[m.kind] ? <span className="px-1 text-xs font-bold text-muted">{KIND_LABEL[m.kind]}</span> : null}
                    <p
                      className={`whitespace-pre-wrap break-words rounded-xl px-3 pb-1 pt-1.5 text-[15px] leading-5 shadow-sm ${
                        out ? "rounded-tr-sm bg-chat-out" : "rounded-tl-sm bg-surface"
                      }`}
                    >
                      {m.body}
                      <span className="float-right ml-2 mt-1.5 flex translate-y-0.5 items-center gap-0.5 text-xs font-semibold tabular-nums text-muted">
                        {formatTime(new Date(m.createdAt))}
                        {out ? <Status state="sent" /> : null}
                      </span>
                    </p>
                    {m.intent ? (
                      <span className="rounded-full bg-surface px-2 text-xs font-bold leading-5 text-primary-text shadow-sm">
                        {INTENT_LABEL[m.intent]} · agenda atualizada
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {locals.map((b) => (
              <div key={`l${b.id}`} className="grid max-w-[82%] justify-items-end gap-1 self-end">
                <p className="whitespace-pre-wrap break-words rounded-xl rounded-tr-sm bg-chat-out px-3 pb-1 pt-1.5 text-[15px] leading-5 shadow-sm">
                  {b.text}
                  <span className="float-right ml-2 mt-1.5 flex translate-y-0.5 items-center gap-0.5 text-xs font-semibold tabular-nums text-muted">
                    {formatTime(b.at)}
                    <Status state={b.state} />
                  </span>
                </p>
                {typeof b.state === "object" ? (
                  <p role="alert" className="text-right text-xs font-semibold text-fail">
                    Não enviada. {messageFor(b.state.failed)}{" "}
                    {b.state.failed === "WHATSAPP_OFFLINE" ? (
                      <Link href="/ajustes/whatsapp" className="inline-flex min-h-11 items-center font-bold underline">
                        Reconectar
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deliver(b.id, b.text)}
                        className="inline-flex min-h-11 items-center font-bold underline"
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

          <form
            onSubmit={send}
            className="flex items-end gap-2 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),10px)] [html[data-kb]_&]:pb-2"
          >
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

function Status({ state }: { state: "sending" | "sent" | { failed: ErrorCode } }) {
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
