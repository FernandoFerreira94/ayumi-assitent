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
      className="min-h-13 w-full rounded-2xl bg-primary px-5 font-bold text-on-primary active:scale-[0.97] disabled:opacity-70"
    >
      {busy ? "Copiando…" : "Copiar texto para divulgar"}
    </button>
  );
}
