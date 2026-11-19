"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { updatePayment } from "./actions";
import { PaymentFields } from "./PaymentFields";
import type { PaymentMethod, PaymentView } from "./payment";

/** Folha para marcar (ou desmarcar) que a cliente pagou, depois de agendar e antes ou depois do atendimento. */
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
  const marked = payment.state === "advance" || payment.state === "paid";
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<{ paid: boolean; method: PaymentMethod | null }>({ paid: true, method: payment.method });
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, start] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    // abre já em "Já pagou": é o motivo mais comum de abrir
    if (next) setPick({ paid: true, method: payment.method });
  }

  function save() {
    setError(null);
    const before = { paid: marked, method: payment.method };
    start(async () => {
      const res = await updatePayment({ id, ...pick }).catch(() => null);
      if (!res?.ok) {
        setError(res && !res.ok ? res.code : "NETWORK");
        return;
      }
      setOpen(false);
      const undo = () =>
        void updatePayment({ id, ...before }).then((r) => {
          if (!r.ok) notify.error(r.code, undo);
        });
      notify.undoable(pick.paid ? "Pagamento marcado" : "Voltou para a pagar", undo);
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
              {price} · agora: {payment.label.toLowerCase()}
            </Drawer.Description>
            <div className="grid gap-3">
              <PaymentFields paid={pick.paid} method={pick.method} onChange={setPick} />
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
