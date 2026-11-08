"use client";

import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { setServiceActive } from "./actions";
import { ServiceForm, type ServiceRow } from "./ServiceForm";

/**
 * Folha de serviço. Sem `service`, cadastra; com ele, edita e permite remover (com Desfazer).
 * `children` é o gatilho: o botão "Novo serviço" ou a linha do serviço na lista.
 */
export function ServiceSheet({
  service,
  children = "Novo serviço",
  className = "btn-tint inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-sm font-bold",
}: {
  service?: ServiceRow;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const keyboard = useKeyboardInset(open);

  async function remove(s: ServiceRow) {
    setOpen(false);
    const res = await setServiceActive(s.id, false);
    if (!res.ok) return notify.error(res.code, () => remove(s));
    notify.undoable("Serviço removido", async () => {
      const back = await setServiceActive(s.id, true);
      if (!back.ok) notify.error(back.code);
    });
  }

  return (
    <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className={className}>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
          style={keyboard}
        >
          <Drawer.Title className="pb-1 text-xl font-bold">{service ? "Editar serviço" : "Novo serviço"}</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">Nome, duração e valor.</Drawer.Description>
          <ServiceForm service={service} onSaved={() => setOpen(false)} />
          {service ? (
            <button
              type="button"
              onClick={() => remove(service)}
              className="mt-3 min-h-11 w-full rounded-full text-sm font-bold text-primary-text"
            >
              Remover serviço
            </button>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
