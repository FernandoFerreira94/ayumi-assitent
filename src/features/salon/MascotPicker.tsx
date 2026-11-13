"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Mascot } from "@/components/brand/Mascot";
import { applyMascot } from "@/components/brand/applyMascot";
import { MASCOTS, type MascotKind } from "@/components/brand/mascots";
import { useMascotKind } from "@/components/brand/useMascotKind";
import { notify } from "@/components/feedback/toast";
import { saveMascot } from "./mascot-actions";

/** Meu perfil: escolher o mascote, que troca as cores do app inteiro na hora. */
export function MascotPicker() {
  const side = useSheetSide();
  const current = useMascotKind();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const info = MASCOTS.find((m) => m.id === current) ?? MASCOTS[0];

  function pick(kind: MascotKind) {
    if (kind === current) return setOpen(false);
    const before = current;
    applyMascot(kind);
    setOpen(false);
    start(async () => {
      const res = await saveMascot(kind);
      if (res.ok) notify.success(`Agora com ${MASCOTS.find((m) => m.id === kind)?.name}`);
      else {
        applyMascot(before);
        notify.error(res.code);
      }
    });
  }

  return (
    <Drawer.Root direction={side} open={open} onOpenChange={setOpen}>
      <section aria-label="Mascote e cores" className="glass grid gap-3 rounded-[1.75rem] p-5">
        <h2 className="font-bold">Mascote e cores</h2>
        <Drawer.Trigger
          disabled={pending}
          className="flex min-h-16 items-center gap-3 rounded-3xl bg-soft px-3 py-2 text-left disabled:opacity-60"
        >
          <Mascot size={52} mood="happy" season={null} />
          <span className="grid flex-1">
            <b className="text-base">{info.name}</b>
            <span className="text-sm font-semibold text-muted">{info.tag}</span>
          </span>
          <span className="text-sm font-bold text-primary-text">{pending ? "Salvando…" : "Trocar"}</span>
        </Drawer.Trigger>
      </section>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none", "sheet z-50")}>
<SidePanelClose />
          <Drawer.Title className="pb-1 text-xl font-bold">Mascote e cores</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            O app inteiro troca de cor junto. Só você vê a sua escolha.
          </Drawer.Description>
          <ul className="grid grid-cols-4 gap-2">
            {MASCOTS.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pick(m.id)}
                  aria-pressed={m.id === current}
                  className="grid w-full justify-items-center gap-1 rounded-3xl border-2 border-transparent px-1 py-2 aria-pressed:border-primary aria-pressed:bg-soft"
                >
                  {/* data-mascot só na prévia: cada um aparece com as próprias cores */}
                  <span data-mascot={m.id}>
                    <Mascot kind={m.id} size={60} season={null} />
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold">
                    <i aria-hidden="true" className="size-2.5 rounded-full" style={{ background: m.primary }} />
                    {m.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
