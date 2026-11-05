"use client";

import { useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { createBlock, deleteBlock } from "./actions";

type Props = { id: string; date: string; start: string; end: string; reason: string | null };

export function BlockCard({ id, date, start, end, reason }: Props) {
  const [pending, startT] = useTransition();

  function remove() {
    startT(async () => {
      const res = await deleteBlock(id);
      if (!res.ok) return void notify.error(res.code, remove);
      notify.undoable("Bloqueio removido", async () => {
        const fd = new FormData();
        fd.set("date", date);
        fd.set("start", start);
        fd.set("end", end);
        if (reason) fd.set("reason", reason);
        const back = await createBlock(null, fd);
        if (back.ok) notify.success("Bloqueio restaurado");
        else notify.error(back.code);
      });
    });
  }

  return (
    <li
      className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-soft px-4 py-3"
      aria-busy={pending}
    >
      <div>
        <p className="font-bold">
          <span className="text-primary-text">
            {start}–{end}
          </span>{" "}
          · Bloqueado
        </p>
        {reason ? <p className="text-sm font-semibold text-muted">{reason}</p> : null}
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="min-h-11 rounded-full bg-white px-4 text-sm font-bold text-primary-text active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Removendo…" : "Remover"}
      </button>
    </li>
  );
}
