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
    <li className="glass flex items-center gap-3 rounded-2xl px-4 py-3" aria-busy={pending}>
      <span
        className="grid size-10 shrink-0 place-content-center rounded-full bg-soft/70 text-primary-text"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        >
          <rect x="5" y="10.5" width="14" height="10" rx="3" />
          <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
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
        className="btn-glass min-h-11 shrink-0 rounded-full px-4 text-sm font-bold disabled:opacity-60"
      >
        {pending ? "Removendo…" : "Remover"}
      </button>
    </li>
  );
}
