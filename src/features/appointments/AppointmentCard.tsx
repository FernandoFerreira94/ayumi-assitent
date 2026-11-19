"use client";

import { useEffect, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import type { SyncResult } from "@/features/google/sync";
import { CHAT_BUTTON, ChatGlyph, ChatSheet } from "@/features/messaging/ChatSheet";
import { cancelReturnPrompt, openReturnPrompt } from "@/features/returns/ReturnPrompt";
import { formatBRL, toInstant } from "@/lib/dates";
import type { Outcome } from "@/features/wallet/rules";
import type { ActionResult } from "@/lib/errors";
import { updateStatus } from "./actions";
import { EditAppointmentSheet } from "./EditAppointmentSheet";
import { canMarkNoShow, noShowHint } from "./no-show";
import type { PaymentView } from "./payment";
import { PaymentSheet } from "./PaymentSheet";
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
  /** Desconto dado e observação: ficam à vista para lembrar o motivo do valor. */
  discount?: { label: string; from: string; off: string } | null;
  notes?: string | null;
  /** Pagamento da cliente (selo que abre a folha de marcar). Sem = não mostra. */
  payment?: PaymentView | null;
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
/** O que aconteceu com o pago ao cancelar/faltar, para o toast: ". R$ 50,00 virou crédito; o sinal R$ 30,00 ficou". */
function walletNote(w: Outcome | null): string {
  if (!w) return "";
  const parts = [
    w.toCredit > 0 ? `${formatBRL(w.toCredit)} virou crédito da cliente` : "",
    w.retained > 0 ? `sinal de ${formatBRL(w.retained)} ficou para o salão` : "",
    w.sessionBack ? "a sessão voltou para o pacote" : "",
  ].filter(Boolean);
  return parts.length ? `. ${parts.join("; ")}` : "";
}

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

export function AppointmentCard({ id, time, date, start: startHHMM, clientId, clientName, clientPhone, serviceId, serviceName, price, status, discount, notes, payment, inSheet = false, past = false, onSettled }: Props) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<Status | null>(null);
  const open = status === "pending_confirmation" || status === "confirmed" || status === "reschedule_requested";
  // Quem pediu para remarcar já abre com Remarcar à vista
  const [more, setMore] = useState(status === "reschedule_requested");
  // Faltou só depois do horário de início; o botão liga sozinho quando a hora chega
  const startsAt = toInstant(date, startHHMM);
  const startMs = startsAt.getTime();
  const [now, setNow] = useState(() => Date.now());
  const noShowOk = canMarkNoShow(startsAt, new Date(now));
  useEffect(() => {
    const wait = startMs - Date.now();
    // setTimeout não aguenta esperas longas; para outro dia a tela já terá sido aberta de novo
    if (wait <= 0 || wait > 24 * 3600_000) return;
    const t = setTimeout(() => setNow(Date.now()), wait + 500);
    return () => clearTimeout(t);
  }, [startMs]);

  function change(next: Status, undoTo?: Status) {
    setBusy(next);
    start(async () => {
      const res: ActionResult<{ sync: SyncResult; wallet: Outcome | null }> = await updateStatus(id, next);
      setBusy(null);
      if (!res.ok) {
        notify.error(res.code, () => change(next, undoTo));
        return;
      }
      warnSync(res.data.sync);
      // Cancelar, Faltou e Concluir valem na hora e trazem Desfazer (6 s), sem pedir segundo toque
      if (undoTo && UNDO_TEXT[next]) {
        onSettled?.();
        const undo = () => {
          cancelReturnPrompt(id);
          change(undoTo);
        };
        const toastId = notify.undoable(UNDO_TEXT[next] + walletNote(res.data.wallet), undo, undefined, next === "done" ? "success" : "warning");
        // Concluiu: pergunta se já marca o retorno (só abre se o serviço tem retorno)
        if (next === "done") openReturnPrompt({ appointmentId: id, undo, toastId });
      } else {
        notify.success(LABEL[next]);
      }
    });
  }

  const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold disabled:opacity-60";
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
      {payment && status !== "cancelled" && status !== "no_show" ? (
        <PaymentSheet
          id={id}
          clientName={clientName}
          price={price}
          payment={payment}
          nested={inSheet}
          triggerClassName={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-sm font-bold ${
            payment.state === "unpaid"
              ? "bg-soft text-primary-text"
              : payment.state === "deposit"
                ? "bg-wait-bg text-wait"
                : "bg-ok-bg text-ok"
          }`}
        >
          <Icon name={payment.state === "unpaid" || payment.state === "deposit" ? "wallet" : "checkCircle"} size={18} />
          <span className="flex-1">{payment.label}</span>
          <span className="text-xs font-semibold opacity-80">
            {payment.state === "unpaid" ? "Marcar pago" : payment.state === "deposit" ? "Receber o resto" : "Mudar"}
          </span>
        </PaymentSheet>
      ) : null}
      {discount ? (
        <p className="rounded-xl bg-ok-bg px-3 py-2 text-sm font-semibold text-ok">
          Desconto de {discount.label}: <s>{discount.from}</s> − {discount.off} = {price}
        </p>
      ) : null}
      {notes ? (
        <p className="rounded-xl bg-soft px-3 py-2 text-sm font-semibold">
          <span className="text-muted">Observação: </span>
          {notes}
        </p>
      ) : null}
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
              <Icon name="check" size={18} />
              {busy === "confirmed" ? "Confirmando…" : "Confirmar"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => change("done", status)}
              className={`${btn} btn-tint w-full`}
            >
              <Icon name="checkCircle" size={18} />
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
              <Icon name="more" size={18} />
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
                disabled={pending || !noShowOk}
                aria-describedby={noShowOk ? undefined : `falta-${id}`}
                onClick={() => change("no_show", status)}
                className={`${btn} btn-glass`}
              >
                <Icon name="userX" size={18} />
                {busy === "no_show" ? "Salvando…" : "Faltou"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => change("cancelled", status)}
                className={`${btn} btn-glass`}
              >
                <Icon name="close" size={18} />
                {busy === "cancelled" ? "Cancelando…" : "Cancelar"}
              </button>
              {noShowOk ? null : (
                <p id={`falta-${id}`} className="w-full text-xs font-semibold text-muted">
                  Faltou: {noShowHint(startHHMM).toLowerCase()}
                </p>
              )}
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
