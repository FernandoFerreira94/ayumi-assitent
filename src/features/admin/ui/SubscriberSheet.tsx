"use client";

import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { SHEET_SCROLL, sheetClass, SidePanelClose, useSheetSide } from "@/components/ui/AdaptiveSheet";
import type { OverviewRow, PaymentRow } from "../types";
import { fmtDate, formatBRL, METHOD_LABEL } from "./format";
import { PaymentBadge, StatusBadge } from "./StatusBadge";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold">{children}</dd>
    </div>
  );
}

/** Detalhe do salão (folha no celular, painel à direita no desktop). Abre pelo ?salao= e fecha voltando à lista. */
export function SubscriberSheet({ row, payments }: { row: OverviewRow | null; payments: PaymentRow[] }) {
  const side = useSheetSide();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Drawer.Root direction={side} open={Boolean(row)} onOpenChange={(open) => !open && router.replace(pathname, { scroll: false })}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto h-[88dvh] max-w-[520px] rounded-t-3xl pt-4 outline-none", "sheet z-50 flex flex-col")}
        >
          <SidePanelClose />
          {row ? (
            <>
              <div className="px-5 md:px-0">
                <Drawer.Title className="pr-12 text-xl font-bold">{row.salonName}</Drawer.Title>
                <Drawer.Description className="pb-3 text-sm font-semibold text-muted">
                  {row.ownerName} · {row.ownerEmail}
                </Drawer.Description>
              </div>
              <div className={SHEET_SCROLL}>
                <dl className="rounded-2xl bg-bg px-4">
                  <Item label="Situação"><StatusBadge status={row.status} /></Item>
                  <Item label="Plano">{row.planName}</Item>
                  {row.planKind === "empresa" ? (
                    <Item label="Profissionais">
                      {row.activeProfessionals} de {row.seats} em uso
                    </Item>
                  ) : null}
                  <Item label="Valor">
                    {formatBRL(row.amountCents)}
                    {row.planInterval === "year" ? "/ano" : "/mês"}
                  </Item>
                  <Item label="Pagamento">{row.paymentMethod ? METHOD_LABEL[row.paymentMethod] : "—"}</Item>
                  {row.status === "trialing" ? <Item label="Teste até">{fmtDate(row.trialEndsAt)}</Item> : null}
                  {row.nextDueAt ? (
                    <Item label={row.status === "past_due" ? "Venceu em" : "Próximo vencimento"}>{fmtDate(row.nextDueAt)}</Item>
                  ) : null}
                  {row.daysPastDue ? (
                    <Item label="Atraso"><span className="text-fail">{row.daysPastDue} dias (desde {fmtDate(row.pastDueSince)})</span></Item>
                  ) : null}
                  <Item label="Último pagamento">{fmtDate(row.lastPaidAt)}</Item>
                  {row.canceledAt ? <Item label="Cancelou em">{fmtDate(row.canceledAt)}</Item> : null}
                  {row.cancelReason ? <Item label="Motivo">{row.cancelReason}</Item> : null}
                  <Item label="Cliente desde">{fmtDate(row.createdAt)}</Item>
                  {row.providerSubscriptionId ? <Item label="Id no Mercado Pago"><span className="font-mono text-xs">{row.providerSubscriptionId}</span></Item> : null}
                </dl>

                <h3 className="pb-2 pt-5 text-base font-bold">Pagamentos recentes</h3>
                {payments.length ? (
                  <ul className="grid gap-2">
                    {payments.map((p) => (
                      <li key={p.paymentId} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                        <span className="grid">
                          <span className="text-sm font-bold tabular-nums">{formatBRL(p.amountCents)}</span>
                          <span className="text-xs font-semibold text-muted">
                            {fmtDate(p.paidAt ?? p.createdAt)} · {METHOD_LABEL[p.method]}
                          </span>
                        </span>
                        <PaymentBadge status={p.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl bg-bg px-4 py-3 text-sm font-semibold text-muted">Nenhum pagamento ainda.</p>
                )}
              </div>
            </>
          ) : (
            <Drawer.Title className="sr-only">Salão</Drawer.Title>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
