"use client";

import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon } from "@/components/ui/Icon";
import type { GuideOutcome, WalletGuide } from "./rules";

const TONE: Record<GuideOutcome["tone"], string> = {
  ok: "bg-ok-bg text-ok",
  keep: "bg-soft text-primary-text",
  same: "bg-soft text-muted",
};

/** "Como funciona": o caminho do agendamento em 3 passos, o resultado de cada situação e 3 lembretes. */
export function WalletRulesSheet({ guide, className = "" }: { guide: WalletGuide; className?: string }) {
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
            <Drawer.Title className="pb-1 text-xl font-bold">Como funciona</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Tudo acontece sozinho.
            </Drawer.Description>

            <ol className="grid gap-0 pb-4" aria-label="Passo a passo">
              {guide.steps.map((s, i) => (
                <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < guide.steps.length - 1 ? (
                    <span aria-hidden="true" className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-0.5 bg-line" />
                  ) : null}
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                    <Icon name={s.icon} size={20} />
                  </span>
                  <p className="min-w-0 pt-0.5">
                    <span className="block font-bold">
                      {i + 1}. {s.title}
                    </span>
                    <span className="block text-sm font-semibold text-muted">{s.text}</span>
                  </p>
                </li>
              ))}
            </ol>

            <h3 className="pb-2 text-xs font-bold uppercase tracking-wide text-muted">E se…</h3>
            <ul className="grid gap-2 pb-4">
              {guide.outcomes.map((o) => (
                <li key={o.when} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-2.5">
                  <span className="min-w-0 flex-1 text-sm font-bold">{o.when}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${TONE[o.tone]}`}>
                    {o.result}
                  </span>
                </li>
              ))}
            </ul>

            <ul className="grid gap-1.5 rounded-2xl bg-soft px-4 py-3 pb-3">
              {guide.notes.map((n) => (
                <li key={n} className="flex gap-2 text-sm font-semibold">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
