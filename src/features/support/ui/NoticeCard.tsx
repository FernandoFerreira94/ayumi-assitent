"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { dismissPlatformNotice } from "../actions";

/** Aviso do Bubbly no Painel. "Fechar" some na hora e grava; se falhar, volta e mostra o erro. */
export function NoticeCard({ id, title, body, tone }: { id: string; title: string; body: string; tone: "info" | "important" }) {
  const [hidden, setHidden] = useState(false);
  const [, start] = useTransition();
  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    start(async () => {
      const res = await dismissPlatformNotice(id).catch(() => null);
      if (!res?.ok) {
        setHidden(false);
        notify.error(res && !res.ok ? res.code : "NETWORK", dismiss);
      }
    });
  }

  const important = tone === "important";
  return (
    <section
      aria-label={`Aviso do Bubbly: ${title}`}
      className={`glass flex items-start gap-3 rounded-2xl py-3 pl-4 pr-1 ${important ? "border-l-4 border-l-wait" : ""}`}
    >
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-text">{important ? "Importante" : "Aviso do Bubbly"}</p>
        <h2 className="font-bold leading-tight">{title}</h2>
        <p className="whitespace-pre-line text-sm font-semibold text-muted">{body}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={`Fechar aviso: ${title}`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-soft"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </section>
  );
}
