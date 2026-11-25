"use client";

import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";

/**
 * Folha de confirmação forte: o botão vermelho só libera depois de digitar a palavra (sem diferença de maiúscula).
 * Usada no Excluir minha conta e no Excluir de pacote/promoção. `onConfirm` devolve true para fechar.
 */
export function TypeToConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  word,
  confirmLabel,
  busyLabel = "Excluindo…",
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** palavra a digitar, mostrada como está ("EXCLUIR", "excluir") */
  word: string;
  confirmLabel: string;
  busyLabel?: string;
  onConfirm: (typed: string) => Promise<boolean>;
  /** conteúdo extra entre a explicação e o campo (ex.: o que acontece com quem já usou) */
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const ready = text.trim().toLowerCase() === word.toLowerCase();

  async function confirm() {
    setBusy(true);
    const done = await onConfirm(text).catch(() => false);
    setBusy(false);
    if (done) {
      setText("");
      onOpenChange(false);
    }
  }

  return (
    <Drawer.Root
      open={open}
      repositionInputs={false}
      dismissible={!busy}
      onOpenChange={(v) => {
        if (busy) return;
        if (!v) setText("");
        onOpenChange(v);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Title className="pb-1 text-xl font-bold">{title}</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">{description}</Drawer.Description>
          {children}
          <label className="grid gap-1 pb-4 text-sm font-bold">
            Digite {word} para confirmar
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoCapitalize={word === word.toUpperCase() ? "characters" : "none"}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={busy}
              className="min-h-13 w-full min-w-0 rounded-full border px-5 text-base font-semibold"
            />
          </label>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={busy || !ready}
              aria-busy={busy}
              className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-fail px-5 font-bold text-white disabled:opacity-50"
            >
              {busy ? <span className="spin" aria-hidden="true" /> : null}
              {busy ? busyLabel : confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="btn-glass flex min-h-13 items-center justify-center rounded-2xl px-5 font-bold"
            >
              Cancelar
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
