"use client";

import { useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { formatBRL, formatShortDate } from "@/lib/dates";
import { deleteExpense } from "./actions";
import { categoryLabel, type ExpenseRow } from "./expenses";

function Row({ e }: { e: ExpenseRow }) {
  const [pending, start] = useTransition();
  function remove() {
    start(async () => {
      const res = await deleteExpense(e.id);
      if (res.ok) notify.success("Gasto removido");
      else notify.error(res.code, remove);
    });
  }
  return (
    <li className="flex items-center gap-3 py-2" aria-busy={pending}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{e.note || categoryLabel(e.category)}</p>
        <p className="text-xs font-semibold text-muted">
          {categoryLabel(e.category)} · {formatShortDate(e.spentOn)}
        </p>
      </div>
      <span className="text-sm font-bold tabular-nums">{formatBRL(e.amountCents)}</span>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`Remover gasto de ${formatBRL(e.amountCents)}`}
        className="btn-glass grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-60"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
        </svg>
      </button>
    </li>
  );
}

export function ExpenseList({ rows }: { rows: ExpenseRow[] }) {
  return (
    <ul className="grid divide-y divide-line/60">
      {rows.map((e) => (
        <Row key={e.id} e={e} />
      ))}
    </ul>
  );
}
