"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import type { SyncResult } from "@/features/google/sync";
import type { ActionResult } from "@/lib/errors";
import { updateStatus } from "./actions";
import { warnSync } from "./sync-warning";
import type { Status } from "./schema";

type Props = {
  id: string;
  time: string;
  clientName: string;
  serviceName: string;
  price: string;
  status: Status;
};

const LABEL: Record<Status, string> = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
  no_show: "Faltou",
};

export function AppointmentCard({ id, time, clientName, serviceName, price, status }: Props) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<Status | null>(null);

  function change(next: Status, undoTo?: Status) {
    setBusy(next);
    start(async () => {
      const res: ActionResult<{ sync: SyncResult }> = await updateStatus(id, next);
      setBusy(null);
      if (!res.ok) {
        notify.error(res.code, () => change(next, undoTo));
        return;
      }
      warnSync(res.data.sync);
      if (next === "cancelled" && undoTo) {
        notify.undoable("Agendamento cancelado", () => change(undoTo));
      } else {
        notify.success(LABEL[next]);
      }
    });
  }

  const btn = "min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60";
  return (
    <li className="glass grid gap-2 rounded-2xl px-4 py-3" aria-busy={pending}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold">
          <span className="text-primary-text">{time}</span> · {clientName}
        </p>
        <p className="text-sm font-bold">{price}</p>
      </div>
      <p className="text-sm font-semibold text-muted">
        {serviceName} · {LABEL[status]}
      </p>
      {status === "pending_confirmation" || status === "confirmed" ? (
        <div className="flex flex-wrap gap-2">
          {status === "pending_confirmation" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => change("confirmed")}
              className={`${btn} btn-tint`}
            >
              {busy === "confirmed" ? "Confirmando…" : "Confirmar"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => change("done")}
              className={`${btn} btn-tint`}
            >
              {busy === "done" ? "Salvando…" : "Concluir"}
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => change("no_show")}
            className={`${btn} btn-glass`}
          >
            {busy === "no_show" ? "Salvando…" : "Faltou"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => change("cancelled", status)}
            className={`${btn} btn-glass`}
          >
            {busy === "cancelled" ? "Cancelando…" : "Cancelar"}
          </button>
        </div>
      ) : null}
    </li>
  );
}
