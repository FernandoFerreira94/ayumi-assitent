"use client";

import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { NewServiceForm } from "./NewServiceForm";

export function NewServiceSheet({ children = "Adicionar serviço" }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const keyboard = useKeyboardInset(open);

  return (
    <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-5 text-sm font-bold text-on-primary active:scale-[0.97]">
        {children}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] max-w-[520px] overflow-y-auto rounded-t-3xl bg-bg px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
          style={keyboard}
        >
          <Drawer.Title className="pb-1 text-xl font-bold">Adicionar serviço</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Nome, duração e valor.
          </Drawer.Description>
          <NewServiceForm bare onSaved={() => setOpen(false)} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
