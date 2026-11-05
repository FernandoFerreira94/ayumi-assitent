"use client";

import { useActionState, useState } from "react";
import { Drawer } from "vaul";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { messageFor, type ActionResult } from "@/lib/errors";
import { maskPhone } from "@/lib/phone";
import { createClient } from "./actions";

const input =
  "min-h-13 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold outline-none focus:border-primary";

export function NewClientSheet() {
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
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-on-primary active:scale-[0.97]">
        Nova cliente
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl bg-bg px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Title className="pb-1 text-xl font-bold">Nova cliente</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Nome e WhatsApp são suficientes.
          </Drawer.Description>
          <form action={action} className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">
              Nome
              <input name="name" required autoComplete="off" className={input} aria-invalid={err?.field === "name"} />
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
