"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { markAllAvisosRead, markClientAvisoRead } from "./actions";
import type { Aviso } from "./core";

const READ_KEY = "mimo:avisos-lidos";
/** Quanto arrastar para o lado (px) para o aviso contar como visto. */
const SWIPE_DONE = 90;

/** Chave de um aviso. O título entra porque traz a contagem: se mudar, o aviso volta como novo. */
const keyOf = (a: Aviso) => `${a.id}|${a.title}`;

function readSeen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeSeen(keys: string[]) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(keys.slice(-60)));
  } catch {}
}

/**
 * Sino em vidro que abre os avisos num diálogo no meio da tela. Cada aviso é só um aviso: tocar abre o que
 * ele pede, deslizar para o lado marca como visto, e "Marcar todas como lidas" limpa a lista.
 * Aviso de mensagem de cliente é gravado no servidor (some em todos os aparelhos); os outros (WhatsApp,
 * Google, pendências) são estados do app e ficam escondidos neste aparelho até a situação mudar.
 */
export function NotificationsSheet({ avisos }: { avisos: Aviso[] }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  // O painel só entra na página na primeira abertura: fechado, o diálogo não deixa texto escondido no DOM
  const [opened, setOpened] = useState(false);

  // localStorage só existe no navegador: lê depois da hidratação, fora do corpo do efeito
  useEffect(() => {
    void Promise.resolve().then(() => setSeen(readSeen()));
  }, []);

  const shown = avisos.filter((a) => !gone.has(a.id) && !seen.includes(keyOf(a)));
  const count = shown.length;
  const close = () => ref.current?.close();

  async function markRead(a: Aviso) {
    setGone((g) => new Set(g).add(a.id));
    if (a.id.startsWith("message-")) {
      const res = await markClientAvisoRead(a.id.slice("message-".length)).catch(() => null);
      if (!res || !res.ok) {
        setGone((g) => {
          const n = new Set(g);
          n.delete(a.id);
          return n;
        });
        return notify.error(res?.ok === false ? res.code : "NETWORK");
      }
      router.refresh();
    } else {
      const next = [...seen, keyOf(a)];
      setSeen(next);
      writeSeen(next);
    }
  }

  async function markAll() {
    if (busy || count === 0) return;
    setBusy(true);
    const hasMessages = shown.some((a) => a.id.startsWith("message-"));
    const res = hasMessages ? await markAllAvisosRead().catch(() => null) : { ok: true as const };
    setBusy(false);
    if (!res || !res.ok) return notify.error(res && !res.ok ? res.code : "NETWORK", markAll);
    const next = [...seen, ...shown.filter((a) => !a.id.startsWith("message-")).map(keyOf)];
    setSeen(next);
    writeSeen(next);
    setGone((g) => new Set([...g, ...shown.map((a) => a.id)]));
    if (hasMessages) router.refresh();
    notify.success("Tudo marcado como lido");
  }

  return (
    <>
      <button
        type="button"
        aria-label={count > 0 ? `Notificações, ${count} novas` : "Notificações"}
        aria-haspopup="dialog"
        onClick={() => {
          setOpened(true);
          ref.current?.showModal();
        }}
        className="btn-glass relative grid size-11 shrink-0 place-content-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4" />
        </svg>
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 grid min-w-5 place-content-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-on-primary ring-2 ring-white/80"
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>
      <dialog
        ref={ref}
        aria-label="Notificações"
        // Toque no fundo: o alvo é o próprio <dialog>, que ocupa a tela toda
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="notif-dialog"
      >
        <div className="status-fill" aria-hidden="true" />
        {opened ? (
          <div className="notif-panel grid max-h-[min(78dvh,640px)] w-[min(92vw,400px)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Notificações</h2>
                <p className="text-sm font-semibold text-muted">
                  {count > 0 ? "Deslize para o lado para marcar como vista." : "Tudo em dia por aqui."}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="btn-glass grid size-9 shrink-0 place-content-center rounded-full"
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
            <div className="-mx-1 overflow-y-auto px-1">
              {count === 0 ? (
                <p className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold text-muted">
                  Nenhum atendimento pendente, WhatsApp e Google Agenda conectados.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {shown.map((a) => (
                    <AvisoRow
                      key={a.id}
                      aviso={a}
                      onOpen={() => {
                        void markRead(a);
                        close();
                      }}
                      onRead={() => void markRead(a)}
                    />
                  ))}
                </ul>
              )}
            </div>
            {count > 0 ? (
              <button
                type="button"
                onClick={markAll}
                disabled={busy}
                aria-busy={busy}
                className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold disabled:opacity-60"
              >
                {busy ? <span className="spin" aria-hidden="true" /> : null}
                {busy ? "Marcando…" : "Marcar todas como lidas"}
              </button>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}

/** Aviso que acompanha o dedo para o lado; passou do ponto ao soltar, sai da lista como visto. */
function AvisoRow({ aviso, onOpen, onRead }: { aviso: Aviso; onOpen: () => void; onRead: () => void }) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; sx: number; sy: number; live: boolean } | null>(null);
  const moved = useRef(false);
  const xRef = useRef(0);

  const move = (v: number) => {
    xRef.current = v;
    setX(v);
  };

  function down(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, live: false };
    moved.current = false;
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.live) {
      // Só vira gesto quando é claramente horizontal: a lista continua rolando na vertical
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      d.live = true;
      moved.current = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    move(dx);
  }
  function end(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.live) return;
    setDragging(false);
    if (Math.abs(xRef.current) > SWIPE_DONE) {
      // Termina de sair para o lado antes de sumir da lista
      move(Math.sign(xRef.current) * 420);
      setTimeout(onRead, 180);
    } else move(0);
  }

  return (
    <li
      style={{
        transform: `translateX(${x}px)`,
        opacity: Math.max(0.2, 1 - Math.abs(x) / 320),
        transition: dragging ? "none" : "transform 0.3s var(--spring), opacity 0.3s",
        touchAction: "pan-y",
      }}
      onPointerDown={down}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
      className="flex items-center gap-1 rounded-2xl bg-white/70 pr-1 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]"
    >
      <Link
        href={aviso.href}
        draggable={false}
        onClick={(e) => {
          // Arrastou: não é toque
          if (moved.current) return e.preventDefault();
          onOpen();
        }}
        className="block min-w-0 flex-1 px-4 py-3"
      >
        <span className="block font-bold">{aviso.title}</span>
        <span className="block text-sm font-semibold text-muted">{aviso.hint}</span>
      </Link>
      <button
        type="button"
        onClick={onRead}
        aria-label={`Marcar como vista: ${aviso.title}`}
        className="grid size-9 shrink-0 place-content-center rounded-full text-muted"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </button>
    </li>
  );
}
