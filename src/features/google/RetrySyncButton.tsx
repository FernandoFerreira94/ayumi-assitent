"use client";

import { useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { retrySync } from "./actions";

export function RetrySyncButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function run() {
    start(async () => {
      const res = await retrySync(id);
      if (res.ok) notify.success("Enviado ao Google Agenda");
      else notify.error(res.code, run);
    });
  }
  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      aria-busy={pending}
      className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60"
    >
      {pending ? "Enviando…" : "Enviar ao Google"}
    </button>
  );
}
