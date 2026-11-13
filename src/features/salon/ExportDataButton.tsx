"use client";

import { useState } from "react";
import { notify } from "@/components/feedback/toast";
import { exportMyData } from "./actions";

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Baixar meus dados (LGPD, portabilidade): clientes, agendamentos e despesas em planilhas CSV. */
export function ExportDataButton() {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await exportMyData().catch(() => null);
    setBusy(false);
    if (!res?.ok) return notify.error(res && !res.ok ? res.code : "NETWORK", () => void run());
    const day = new Date().toISOString().slice(0, 10);
    download(`bubbly-clientes-${day}.csv`, res.data.clientes);
    download(`bubbly-agendamentos-${day}.csv`, res.data.agendamentos);
    download(`bubbly-despesas-${day}.csv`, res.data.despesas);
    notify.success("Planilhas baixadas");
  }

  return (
    <section aria-label="Seus dados" className="glass grid gap-2 rounded-[1.75rem] p-5">
      <h2 className="font-bold">Seus dados</h2>
      <p className="text-sm font-semibold text-muted">Baixe suas clientes, agendamentos e despesas em planilhas.</p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        aria-busy={busy}
        className="btn-glass flex min-h-13 items-center justify-center gap-2 rounded-2xl px-5 font-bold disabled:opacity-70"
      >
        {busy ? <span className="spin" aria-hidden="true" /> : null}
        {busy ? "Preparando…" : "Baixar meus dados"}
      </button>
    </section>
  );
}
