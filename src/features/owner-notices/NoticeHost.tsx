"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { loadNotice } from "./actions";

type Notice = { id: string; kind: string; title: string; body: string; detail: string | null };

/**
 * `?aviso=<id>`: tocar no aviso do roteiro da semana ou de uma data comemorativa abre o texto completo num
 * diálogo por cima da tela. Na data comemorativa a mensagem para as clientes vem pronta e editável.
 */
export function NoticeHost() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params.get("aviso");
  const ref = useRef<HTMLDialogElement>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void loadNotice(id)
      .catch(() => null)
      .then((res) => {
        if (!alive) return;
        if (res?.ok) {
          setNotice({ id, ...res.data });
          setText(res.data.detail ?? res.data.body);
        } else {
          notify.error(res && !res.ok ? res.code : "NETWORK");
          router.replace(pathname, { scroll: false });
        }
      });
    return () => {
      alive = false;
    };
  }, [id, pathname, router]);

  useEffect(() => {
    if (notice && notice.id === id && !ref.current?.open) ref.current?.showModal();
  }, [notice, id]);

  const close = () => ref.current?.close();
  const greet = notice?.kind === "holiday";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Mensagem copiada", "Cole no WhatsApp, numa lista de transmissão ou no status.");
    } catch {
      notify.error("UNKNOWN", copy);
    }
  }

  if (!notice || notice.id !== id) return null;
  return (
    <dialog
      ref={ref}
      aria-label={notice.title}
      onClose={() => {
        setNotice(null);
        router.replace(pathname, { scroll: false });
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="notif-dialog"
    >
      <div className="status-fill" aria-hidden="true" />
      <div className="notif-panel grid max-h-[min(86dvh,720px)] w-[min(92vw,400px)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{notice.title}</h2>
            <p className="text-sm font-semibold text-muted">
              {greet ? "Quer mandar um carinho às clientes? Ajuste o texto se quiser." : notice.body}
            </p>
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
        <div className="overflow-y-auto">
          {greet ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              maxLength={600}
              aria-label="Mensagem para as clientes"
              className="w-full resize-none rounded-3xl border px-5 py-3 text-base font-semibold leading-6"
            />
          ) : (
            <p className="whitespace-pre-wrap rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold leading-6">
              {text}
            </p>
          )}
        </div>
        {greet ? (
          <div className="grid gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tint flex min-h-12 items-center justify-center rounded-full px-4 font-bold"
            >
              Abrir no WhatsApp
            </a>
            <button type="button" onClick={copy} className="btn-glass min-h-12 rounded-full px-4 font-bold">
              Copiar mensagem
            </button>
          </div>
        ) : (
          <button type="button" onClick={close} className="btn-tint min-h-12 rounded-full px-4 font-bold">
            Boa semana!
          </button>
        )}
      </div>
    </dialog>
  );
}
