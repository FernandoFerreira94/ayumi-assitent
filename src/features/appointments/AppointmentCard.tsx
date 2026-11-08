"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import type { SyncResult } from "@/features/google/sync";
import { CHAT_BUTTON, ChatGlyph, ChatSheet } from "@/features/messaging/ChatSheet";
import type { ActionResult } from "@/lib/errors";
import { updateStatus } from "./actions";
import { warnSync } from "./sync-warning";
import type { Status } from "./schema";

type Props = {
  id: string;
  time: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  price: string;
  status: Status;
  /** Já está dentro de uma folha (a da linha do dia): a conversa abre como folha aninhada. */
  inSheet?: boolean;
};

const LABEL: Record<Status, string> = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
  no_show: "Faltou",
};

export function AppointmentCard({
  id,
  time,
  clientId,
  clientName,
  clientPhone,
  serviceName,
  price,
  status,
  inSheet = false,
}: Props) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<Status | null>(null);
  // Cancelar pede um segundo toque: o primeiro só troca o texto do botão
  const [askCancel, setAskCancel] = useState(false);

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
            <button type="button" disabled={pending} onClick={() => change("confirmed")} className={`${btn} btn-tint`}>
              {busy === "confirmed" ? "Confirmando…" : "Confirmar"}
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={() => change("done")} className={`${btn} btn-tint`}>
              {busy === "done" ? "Salvando…" : "Concluir"}
            </button>
          )}
          <button type="button" disabled={pending} onClick={() => change("no_show")} className={`${btn} btn-glass`}>
            {busy === "no_show" ? "Salvando…" : "Faltou"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => (askCancel ? change("cancelled", status) : setAskCancel(true))}
            className={`${btn} btn-glass ${askCancel ? "text-fail" : ""}`}
          >
            {busy === "cancelled" ? "Cancelando…" : askCancel ? "Toque de novo para cancelar" : "Cancelar"}
          </button>
        </div>
      ) : null}
      {/* Em qualquer status: dá para falar com a cliente mesmo depois de concluído ou se faltou */}
      <ChatSheet
        nested={inSheet}
        clientId={clientId}
        clientName={clientName}
        phone={clientPhone}
        triggerClassName={`${btn} ${CHAT_BUTTON}`}
      >
        <ChatGlyph />
        Mensagem no WhatsApp
      </ChatSheet>
    </li>
  );
}
