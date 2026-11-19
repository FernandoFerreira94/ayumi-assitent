"use client";

import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon } from "@/components/ui/Icon";
import type { RuleSection } from "./rules";

/** Botão "Como funciona" com as regras do dinheiro da cliente (sinal, crédito, devolução, pacotes e caixa). */
export function WalletRulesSheet({ rules, className = "" }: { rules: RuleSection[]; className?: string }) {
  const side = useSheetSide();
  return (
    <Drawer.Root direction={side} repositionInputs={false}>
      <Drawer.Trigger
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-primary-text ${className}`}
      >
        <Icon name="compass" size={16} />
        Como funciona
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
            <Drawer.Title className="pb-1 text-xl font-bold">Como funciona o dinheiro da cliente</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Tudo isso acontece sozinho. As regras seguem o que está em Ajustes &gt; Pagamentos.
            </Drawer.Description>
            <div className="grid gap-3 pb-2">
              {rules.map((r) => (
                <section key={r.title} className="rounded-2xl bg-soft px-4 py-3">
                  <h3 className="pb-1 font-bold">{r.title}</h3>
                  <ul className="grid gap-1.5">
                    {r.items.map((it) => (
                      <li key={it} className="flex gap-2 text-sm font-semibold">
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
