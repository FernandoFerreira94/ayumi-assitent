"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { formatTime, todayStr } from "@/lib/dates";
import { messageFor, type ActionResult, type ErrorCode } from "@/lib/errors";
import { SUPPORT_MAX_LEN } from "../rules";

/** Mensagem pronta para o cliente (datas em ISO: vêm de um componente do servidor). */
export type ThreadMessage = { id: string; author: "salon" | "admin"; body: string; createdAt: string };

type Local = { id: number; text: string; at: Date; failed?: ErrorCode };

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
 * Conversa de suporte nos dois lados (salão em Ajustes > Ajuda e suporte; dono no /admin). `me` decide de
 * que lado ficam os balões. Depois de enviar, `router.refresh()` traz a lista do servidor.
 */
export function SupportThread({
  me,
  messages,
  send,
  label,
  empty,
  className = "",
}: {
  me: "salon" | "admin";
  messages: ThreadMessage[];
  send: (body: string) => Promise<ActionResult>;
  /** Nome acessível do campo. */
  label: string;
  empty: string;
  className?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [locals, setLocals] = useState<Local[]>([]);
  const seq = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const total = messages.length + locals.length;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [total]);

  async function deliver(id: number, body: string) {
    setLocals((ls) => ls.map((l) => (l.id === id ? { ...l, failed: undefined } : l)));
    const res = await send(body).catch(() => null);
    if (res?.ok) {
      // Na mesma transição: o balão local só some quando a lista nova do servidor chega
      startTransition(() => {
        router.refresh();
        setLocals((ls) => ls.filter((l) => l.id !== id));
      });
    } else {
      setLocals((ls) => ls.map((l) => (l.id === id ? { ...l, failed: res && !res.ok ? res.code : "NETWORK" } : l)));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const id = ++seq.current;
    setLocals((ls) => [...ls, { id, text: body, at: new Date() }]);
    setText("");
    void deliver(id, body);
  }

  return (
    <div className={`flex min-h-0 flex-col rounded-[1.4rem] bg-chat-bg ${className}`}>
      <div className="flex min-h-40 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4" aria-live="polite">
        {messages.length === 0 && locals.length === 0 ? (
          <p className="mx-auto my-auto max-w-[36ch] rounded-lg bg-surface/80 px-3 py-2 text-center text-sm font-semibold text-muted">
            {empty}
          </p>
        ) : null}
        {messages.map((m, i, all) => {
          const day = dayLabel(m.createdAt);
          const sep = i === 0 || day !== dayLabel(all[i - 1]!.createdAt);
          const mine = m.author === me;
          return (
            <div key={m.id} className="contents">
              {sep ? <p className="mx-auto my-1 rounded-lg bg-surface/80 px-2.5 py-0.5 text-xs font-bold text-muted">{day}</p> : null}
              <div className={`grid max-w-[85%] gap-0.5 ${mine ? "justify-items-end self-end" : "justify-items-start self-start"}`}>
                {!mine ? (
                  <span className="px-1 text-xs font-bold text-muted">{m.author === "admin" ? "Suporte Bubbly" : "Salão"}</span>
                ) : null}
                <p
                  className={`whitespace-pre-wrap break-words rounded-xl px-3 pb-1 pt-1.5 text-[15px] leading-5 shadow-sm ${
                    mine ? "rounded-tr-sm bg-chat-out" : "rounded-tl-sm bg-surface"
                  }`}
                >
                  {m.body}
                  <span className="float-right ml-2 mt-1.5 translate-y-0.5 text-xs font-semibold tabular-nums text-muted">
                    {formatTime(new Date(m.createdAt))}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
        {locals.map((b) => (
          <div key={`l${b.id}`} className="grid max-w-[85%] justify-items-end gap-1 self-end">
            <p
              className={`whitespace-pre-wrap break-words rounded-xl rounded-tr-sm bg-chat-out px-3 pb-1 pt-1.5 text-[15px] leading-5 shadow-sm ${b.failed ? "" : "opacity-70"}`}
            >
              {b.text}
              <span className="float-right ml-2 mt-1.5 translate-y-0.5 text-xs font-semibold tabular-nums text-muted">
                {b.failed ? formatTime(b.at) : "Enviando…"}
              </span>
            </p>
            {b.failed ? (
              <p role="alert" className="text-right text-xs font-semibold text-fail">
                Não enviada. {messageFor(b.failed)}{" "}
                <button type="button" onClick={() => deliver(b.id, b.text)} className="inline-flex min-h-11 items-center font-bold underline">
                  Tentar de novo
                </button>
              </p>
            ) : null}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={submit} className="flex items-end gap-2 px-2 pb-2 pt-1">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
          }}
          rows={1}
          maxLength={SUPPORT_MAX_LEN}
          aria-label={label}
          placeholder="Escreva sua mensagem"
          className="min-h-11 flex-1 resize-none rounded-3xl bg-surface px-4 py-2.5 text-base leading-6 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
    </div>
  );
}

/** Ao abrir a conversa, marca como lida o que veio do outro lado (uma vez por montagem). */
export function MarkRead({ run }: { run: () => Promise<unknown> }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void run().catch(() => {});
  }, [run]);
  return null;
}
