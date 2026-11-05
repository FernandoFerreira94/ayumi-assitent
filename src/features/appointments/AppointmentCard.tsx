"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { updateStatus } from "./actions";
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
      const res: ActionResult = await updateStatus(id, next);
      setBusy(null);
      if (!res.ok) {
        notify.error(res.code, () => change(next, undoTo));
        return;
      }
      if (next === "cancelled" && undoTo) {
        notify.undoable("Agendamento cancelado", () => change(undoTo));
      } else {
        notify.success(LABEL[next]);
      }
    });
  }

  const btn = "min-h-11 rounded-full px-4 text-sm font-bold active:scale-[0.97] disabled:opacity-60";
  return (
    <li className="grid gap-2 rounded-2xl border border-line bg-white px-4 py-3" aria-busy={pending}>
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
              className={`${btn} bg-primary text-on-primary`}
            >
              {busy === "confirmed" ? "Confirmando…" : "Confirmar"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => change("done")}
              className={`${btn} bg-primary text-on-primary`}
            >
              {busy === "done" ? "Salvando…" : "Concluir"}
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => change("no_show")}
            className={`${btn} bg-soft text-primary-text`}
          >
            {busy === "no_show" ? "Salvando…" : "Faltou"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => change("cancelled", status)}
            className={`${btn} bg-soft text-primary-text`}
          >
            {busy === "cancelled" ? "Cancelando…" : "Cancelar"}
          </button>
        </div>
      ) : null}
    </li>
  );
}
