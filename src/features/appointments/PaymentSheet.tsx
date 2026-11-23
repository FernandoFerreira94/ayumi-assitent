"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { updatePayment } from "./actions";
import { centsToField, fieldToCents, PaymentFields, type PaymentPick } from "./PaymentFields";
import type { PaymentView } from "./payment";
import { formatBRL } from "@/lib/dates";

/** O que estava marcado, para o Desfazer e para abrir a folha. */
function pickOf(p: PaymentView): PaymentPick {
  if (p.state === "deposit") return { choice: "deposit", method: p.method, amount: centsToField(p.paidCents) };
  // Sinal pedido: abre no sinal com o valor pedido ("Sinal recebido")
  if (p.state === "deposit_requested")
    return { choice: "deposit", method: p.method, amount: centsToField(Math.max(p.requestedCents, p.paidCents)) };
  if (p.state === "advance" || p.state === "paid") return { choice: "full", method: p.method, amount: "" };
  return { choice: "none", method: null, amount: "" };
}

const toInput = (p: PaymentPick) => ({
  paid: p.choice !== "none",
  method: p.choice === "none" ? null : p.method,
  amountCents: p.choice === "deposit" ? fieldToCents(p.amount) : null,
});

/**
 * Folha do pagamento da cliente, depois de agendar e antes ou depois do atendimento: a pagar, sinal ou tudo.
 * Com sinal, abre em "Já pagou" (o motivo mais comum é receber o resto); o extrato grava só a diferença.
 */
export function PaymentSheet({
  id,
  clientName,
  price,
  payment,
  nested = false,
  triggerClassName,
  children,
}: {
  id: string;
  clientName: string;
  price: string;
  payment: PaymentView;
  nested?: boolean;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  const side = useSheetSide();
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;
  const total = payment.paidCents + payment.remainingCents;
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<PaymentPick>(
    payment.state === "deposit_requested" ? pickOf(payment) : { ...pickOf(payment), choice: "full" },
  );
  const [error, setError] = useState<ErrorCode | null>(null);
  const [badAmount, setBadAmount] = useState(false);
  const [pending, start] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    setBadAmount(false);
    // abre já em "Já pagou": é o motivo mais comum de abrir (marcar pago ou receber o resto do sinal);
    // com sinal pedido, abre no sinal com o valor pedido (o mais comum é "Sinal recebido")
    if (next) setPick(payment.state === "deposit_requested" ? pickOf(payment) : { ...pickOf(payment), choice: "full" });
  }

  function save() {
    setError(null);
    const input = toInput(pick);
    if (pick.choice === "deposit" && (input.amountCents === null || input.amountCents >= total)) {
      setBadAmount(true);
      return;
    }
    setBadAmount(false);
    const before = toInput(pickOf(payment));
    start(async () => {
      const res = await updatePayment({ id, ...input }).catch(() => null);
      if (!res?.ok) {
        setError(res && !res.ok ? res.code : "NETWORK");
        return;
      }
      setOpen(false);
      const undo = () =>
        void updatePayment({ id, ...before }).then((r) => {
          if (!r.ok) notify.error(r.code, undo);
        });
      notify.undoable(
        pick.choice === "full" ? "Pagamento marcado" : pick.choice === "deposit" ? "Sinal marcado" : "Voltou para a pagar",
        undo,
      );
    });
  }

  return (
    <Root direction={side} open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Trigger className={triggerClassName}>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] rounded-t-3xl pt-4 outline-none",
            "sheet z-50 flex flex-col",
          )}
        >
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="pb-1 text-xl font-bold">Pagamento de {clientName.split(/\s+/)[0]}</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              {price} · agora: {payment.label.replace(/^\p{Lu}/u, (c) => c.toLowerCase())}
            </Drawer.Description>
            {payment.state === "deposit" ? (
              <dl className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-soft px-4 py-3">
                <div>
                  <dt className="text-xs font-bold text-muted">Sinal pago</dt>
                  <dd className="text-lg font-bold tabular-nums text-ok">{formatBRL(payment.paidCents)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted">Falta</dt>
                  <dd className="text-lg font-bold tabular-nums text-primary-text">{formatBRL(payment.remainingCents)}</dd>
                </div>
              </dl>
            ) : null}
            <div className="grid gap-3">
              <PaymentFields value={pick} onChange={setPick} totalCents={total} amountError={badAmount} />
              {error ? (
                <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
                  {messageFor(error)}
                </p>
              ) : null}
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="btn-tint mt-1 flex min-h-13 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
              >
                {pending ? <span className="spin" aria-hidden="true" /> : null}
                {pending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}
