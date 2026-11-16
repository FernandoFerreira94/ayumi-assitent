"use client";

import { useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { updateStatuses } from "./actions";
import type { Status } from "./schema";
import { warnSync } from "./sync-warning";

/** "Concluir todos" em Pendências: fecha os atendimentos que já passaram de uma vez, com Desfazer. */
export function CloseAllButton({ items }: { items: { id: string; status: Status }[] }) {
  const [pending, start] = useTransition();

  function run(next: { id: string; status: Status }[], undo?: { id: string; status: Status }[]) {
    start(async () => {
      const res = await updateStatuses(next);
      if (!res.ok) {
        notify.error(res.code, () => run(next, undo));
        return;
      }
      warnSync(res.data.sync);
      const n = res.data.returns;
      // Em lote não abre uma pergunta por cliente: só avisa quantos retornos ficaram previstos
      const returns = n ? (n === 1 ? "1 retorno previsto" : `${n} retornos previstos`) : undefined;
      if (undo) notify.undoable(`${next.length} atendimentos concluídos`, () => run(undo), returns);
      else notify.success("Desfeito");
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() => run(items.map((i) => ({ id: i.id, status: "done" })), items)}
      className="btn-tint min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Concluir todos"}
    </button>
  );
}
