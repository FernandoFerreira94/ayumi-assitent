"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { centsToField } from "@/features/appointments/PaymentFields";
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "@/features/appointments/payment";
import { formatBRL } from "@/lib/dates";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { refundCreditAction } from "./actions";
import { SellPackageSheet } from "./PackageSheets";

const chip =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line bg-surface px-3 text-sm font-bold transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";

export type WalletCard = { balanceCents: number; moves: { day: string; label: string; cents: number }[] };

/**
 * Carteira na ficha da cliente: crédito que ela tem no salão, os últimos movimentos e "Devolver" (estorno
 * manual). Só aparece quando já houve crédito.
 */
export function ClientWallet({
  clientId,
  clientName,
  wallet,
  nested,
  onChanged,
}: {
  clientId: string;
  clientName: string;
  wallet: WalletCard;
  nested: boolean;
  onChanged: () => void;
}) {
  if (wallet.balanceCents === 0 && wallet.moves.length === 0) return null;
  return (
    <section aria-label="Crédito da cliente" className="glass grid gap-2 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            <Icon name="wallet" size={14} className="text-primary-text" />
            Crédito no salão
          </span>
          <span className={`block text-2xl font-bold tabular-nums ${wallet.balanceCents > 0 ? "text-ok" : ""}`}>
            {formatBRL(wallet.balanceCents)}
          </span>
          {wallet.balanceCents > 0 ? (
            <span className="block text-xs font-semibold text-muted">Usado sozinho no próximo agendamento</span>
          ) : null}
        </p>
        {wallet.balanceCents > 0 ? (
          <RefundSheet
            clientId={clientId}
            clientName={clientName}
            balanceCents={wallet.balanceCents}
            nested={nested}
            onDone={onChanged}
          />
        ) : null}
      </div>
      {wallet.moves.length ? (
        <ul className="divide-y divide-line border-t border-line">
          {wallet.moves.map((m, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 font-semibold">
                {m.label}
                <span className="text-muted"> · {m.day}</span>
              </span>
              <span className={`shrink-0 font-bold tabular-nums ${m.cents > 0 ? "text-ok" : "text-muted"}`}>
                {m.cents > 0 ? "+" : "−"}
                {formatBRL(Math.abs(m.cents))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function RefundSheet({
  clientId,
  clientName,
  balanceCents,
  nested,
  onDone,
}: {
  clientId: string;
  clientName: string;
  balanceCents: number;
  nested: boolean;
  onDone: () => void;
}) {
  const side = useSheetSide();
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(centsToField(balanceCents));
  const [method, setMethod] = useState<PaymentMethod | null>("pix");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [bad, setBad] = useState(false);
  const [pending, start] = useTransition();
  const first = clientName.split(/\s+/)[0];

  function onOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    setBad(false);
    if (next) setAmount(centsToField(balanceCents));
  }

  function save() {
    setError(null);
    setBad(false);
    start(async () => {
      const res = await refundCreditAction({ clientId, amount, method }).catch(() => null);
      if (!res?.ok) {
        if (res && !res.ok && res.field === "amount") setBad(true);
        else setError(res && !res.ok ? res.code : "NETWORK");
        return;
      }
      setOpen(false);
      notify.success(`Devolvido para ${first}`);
      onDone();
    });
  }

  return (
    <Root direction={side} open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Trigger className="btn-tint min-h-11 shrink-0 rounded-full px-4 text-sm font-bold">
        Devolver
      </Drawer.Trigger>
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
            <Drawer.Title className="pb-1 text-xl font-bold">Devolver para {first}</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Crédito de {formatBRL(balanceCents)}. O que você devolver sai do crédito e do caixa do mês.
            </Drawer.Description>
            <div className="grid gap-3">
              <label className="flex items-center gap-3">
                <span className="text-sm font-bold">Valor</span>
                <span className="relative ml-auto w-40">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-muted">
                    R$
                  </span>
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="Valor a devolver"
                    aria-invalid={bad}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`min-h-12 w-full rounded-full border bg-surface pl-11 pr-4 text-right text-base font-bold tabular-nums ${
                      bad ? "border-fail" : "border-line"
                    }`}
                  />
                </span>
              </label>
              {bad ? (
                <p role="alert" className="text-sm font-semibold text-fail">
                  Digite um valor até {formatBRL(balanceCents)}.
                </p>
              ) : null}
              <div className="grid gap-1">
                <p className="text-xs font-bold text-muted">Forma</p>
                <div className="flex gap-2" role="group" aria-label="Forma da devolução">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={method === m}
                      onClick={() => setMethod(method === m ? null : m)}
                      className={chip}
                    >
                      {METHOD_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>
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
                {pending ? "Devolvendo…" : "Devolver"}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}

export type PackageCard = { id: string; name: string; left: number; total: number; until: string | null }[];

/** Pacotes da cliente na ficha (sessões que restam e validade) e "Vender pacote". */
export function ClientPackages({
  clientId,
  clientName,
  packages,
  nested,
  onChanged,
}: {
  clientId: string;
  clientName: string;
  packages: PackageCard;
  nested: boolean;
  onChanged: () => void;
}) {
  return (
    <section aria-label="Pacotes da cliente" className="glass grid gap-2 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex flex-1 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <Icon name="ticket" size={14} className="text-primary-text" />
          Pacotes
        </span>
        <SellPackageSheet clientId={clientId} clientName={clientName} nested={nested} onSold={onChanged} />
      </div>
      {packages.length ? (
        <ul className="divide-y divide-line border-t border-line">
          {packages.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 font-semibold">
                {p.name}
                {p.until ? <span className="text-muted"> · até {p.until}</span> : null}
              </span>
              <span className="shrink-0 font-bold tabular-nums text-primary-text">
                {p.left} de {p.total}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm font-semibold text-muted">Nenhum pacote valendo.</p>
      )}
    </section>
  );
}
