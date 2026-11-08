"use client";

import { useState } from "react";
import { notify } from "@/components/feedback/toast";

export function CopyButton({ text }: { text: string }) {
  const [busy, setBusy] = useState(false);
  async function copy() {
    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Texto copiado", "Cole no WhatsApp ou no Instagram.");
    } catch {
      notify.error("UNKNOWN", copy);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      disabled={busy}
      className="btn-tint flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
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
      {busy ? "Copiando…" : "Copiar texto para divulgar"}
    </button>
  );
}
