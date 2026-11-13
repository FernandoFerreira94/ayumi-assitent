"use client";

import { useActionState, useState } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { messageFor, type ActionResult } from "@/lib/errors";
import { maskPhone } from "@/lib/phone";
import { createClient } from "./actions";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";

export function NewClientSheet() {
  const side = useSheetSide();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [state, action] = useActionState(async (prev: ActionResult<{ id: string }> | null, fd: FormData) => {
    const res = await createClient(prev, fd);
    if (res.ok) {
      notify.success("Cliente cadastrada");
      setOpen(false);
      setPhone("");
    } else if (res.code !== "VALIDATION" && res.code !== "PHONE_EXISTS") {
      notify.error(res.code);
    }
    return res;
  }, null);

  const err = state && !state.ok ? state : null;

  return (
    <Drawer.Root direction={side} repositionInputs={false} open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="10" cy="8" r="4" />
          <path d="M3 20c1.3-3.6 3.9-5.5 7-5.5 1.3 0 2.5.3 3.5.9M18 14v6M15 17h6" />
        </svg>
        Nova cliente
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none", "sheet z-50")}>
<SidePanelClose />
          <Drawer.Title className="pb-1 text-xl font-bold">Nova cliente</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Nome e WhatsApp são suficientes.
          </Drawer.Description>
          <form action={action} className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">
              Nome
              <input
                name="name"
                required
                autoComplete="off"
                placeholder="Ex.: Maria Souza"
                className={input}
                aria-invalid={err?.field === "name"}
              />
              {err?.field === "name" ? (
                <span role="alert" className="text-xs text-primary-text">
                  Informe o nome
                </span>
              ) : null}
            </label>
            <label className="grid gap-1 text-sm font-bold">
              WhatsApp
              <input
                name="phone"
                inputMode="tel"
                autoComplete="off"
                required
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 98765-4321"
                className={input}
                aria-invalid={err?.field === "phone"}
              />
              {err?.field === "phone" ? (
                <span role="alert" className="text-xs text-primary-text">
                  {err.code === "PHONE_EXISTS" ? messageFor("PHONE_EXISTS") : "Telefone inválido"}
                </span>
              ) : null}
            </label>
            <label className="grid gap-1 text-sm font-bold">
              E-mail (opcional)
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="maria@email.com"
                className={input}
                aria-invalid={err?.field === "email"}
              />
              <span className="text-xs font-semibold text-muted">
                Com e-mail, ela recebe o convite na agenda do Google.
              </span>
              {err?.field === "email" ? (
                <span role="alert" className="text-xs text-primary-text">
                  E-mail inválido
                </span>
              ) : null}
            </label>
            <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
