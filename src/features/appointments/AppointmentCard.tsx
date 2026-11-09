"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import type { SyncResult } from "@/features/google/sync";
import { CHAT_BUTTON, ChatGlyph, ChatSheet } from "@/features/messaging/ChatSheet";
import type { ActionResult } from "@/lib/errors";
import { updateStatus } from "./actions";
import { EditAppointmentSheet } from "./EditAppointmentSheet";
import { warnSync } from "./sync-warning";
import type { Status } from "./schema";

type Props = {
  id: string;
  time: string;
  /** Dia (AAAA-MM-DD) e horário (HH:MM) do atendimento, para a folha de reagendar começar preenchida. */
  date: string;
  start: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  price: string;
  status: Status;
  /** Já está dentro de uma folha (a da linha do dia): a conversa abre como folha aninhada. */
  inSheet?: boolean;
  /** Já passou (Pendências → Para fechar): a ação principal é Concluir, mesmo sem confirmação. */
  past?: boolean;
  /**
   * Chamado quando Cancelar, Faltou ou Concluir dá certo. A folha da agenda fecha aqui: com ela aberta,
   * o fundo do vaul fica por cima do toast e o Desfazer não recebe o toque.
   */
  onSettled?: () => void;
};

/** Mudanças que mostram Desfazer em vez do aviso simples. */
const UNDO_TEXT: Partial<Record<Status, string>> = {
  cancelled: "Agendamento cancelado",
  no_show: "Marcado como faltou",
  done: "Atendimento concluído",
};

const LABEL: Record<Status, string> = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  done: "Concluído",
  no_show: "Faltou",
  reschedule_requested: "Quer remarcar",
};

export function AppointmentCard({ id, time, date, start: startHHMM, clientId, clientName, clientPhone, serviceId, serviceName, price, status, inSheet = false, past = false, onSettled }: Props) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<Status | null>(null);
  const open = status === "pending_confirmation" || status === "confirmed" || status === "reschedule_requested";
  // Quem pediu para remarcar já abre com Remarcar à vista
  const [more, setMore] = useState(status === "reschedule_requested");

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
      // Cancelar, Faltou e Concluir valem na hora e trazem Desfazer (6 s), sem pedir segundo toque
      if (undoTo && UNDO_TEXT[next]) {
        onSettled?.();
        notify.undoable(UNDO_TEXT[next], () => change(undoTo));
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
      {status === "reschedule_requested" ? (
        <p className="rounded-xl bg-wait-bg px-3 py-2 text-sm font-semibold text-wait">
          Ela pediu para remarcar. Combine pela conversa; se ficar neste horário, toque em Confirmar.
        </p>
      ) : null}
      {open ? (
        <>
          {/* Uma ação principal grande; o resto fica em "Mais" para o cartão não virar um muro de botões */}
          {status !== "confirmed" && !past ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => change("confirmed")}
              className={`${btn} btn-tint w-full`}
            >
              {busy === "confirmed" ? "Confirmando…" : "Confirmar"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => change("done", status)}
              className={`${btn} btn-tint w-full`}
            >
              {busy === "done" ? "Salvando…" : "Concluir"}
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            <ChatSheet nested={inSheet} clientId={clientId} clientName={clientName} phone={clientPhone} triggerClassName={`${btn} ${CHAT_BUTTON}`}>
              <ChatGlyph />
              Mensagem no WhatsApp
            </ChatSheet>
            <button
              type="button"
              aria-expanded={more}
              aria-controls={`mais-${id}`}
              aria-label="Mais ações"
              onClick={() => setMore((v) => !v)}
              className={`${btn} btn-glass`}
            >
              {more ? "Menos" : "Mais"}
            </button>
          </div>
          {more ? (
            <div id={`mais-${id}`} className="flex flex-wrap gap-2">
              <EditAppointmentSheet
                id={id}
                clientName={clientName}
                serviceId={serviceId}
                serviceName={serviceName}
                date={date}
                start={startHHMM}
                nested={inSheet}
                triggerClassName={`${btn} ${status === "reschedule_requested" ? "btn-tint" : "btn-glass"}`}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => change("no_show", status)}
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
        </>
      ) : (
        /* Concluído, faltou ou cancelado: ainda dá para falar com a cliente */
        <ChatSheet nested={inSheet} clientId={clientId} clientName={clientName} phone={clientPhone} triggerClassName={`${btn} ${CHAT_BUTTON}`}>
          <ChatGlyph />
          Mensagem no WhatsApp
        </ChatSheet>
      )}
    </li>
  );
}
