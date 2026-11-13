"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import { authClient } from "@/lib/auth-client";
import { deleteAccount } from "./actions";

const CONFIRM = "EXCLUIR";

/** Excluir minha conta (LGPD): folha por cima de Meu perfil, só libera depois de digitar EXCLUIR. */
export function DeleteAccountSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const ready = text.trim().toUpperCase() === CONFIRM;

  async function confirm() {
    setBusy(true);
    const res = await deleteAccount(text).catch(() => null);
    if (!res?.ok) {
      setBusy(false);
      notify.error(res && !res.ok ? res.code : "NETWORK", () => void confirm());
      return;
    }
    await authClient.signOut().catch(() => undefined);
    notify.success("Conta excluída. Seus dados foram apagados.");
    router.replace("/login");
    router.refresh();
  }

  return (
    <section aria-label="Excluir conta" className="grid justify-items-center pb-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-full px-4 text-sm font-bold text-fail"
      >
        Excluir minha conta
      </button>
      <Drawer.Root
        open={open}
        repositionInputs={false}
        dismissible={!busy}
        onOpenChange={(v) => {
          if (busy) return;
          if (!v) setText("");
          setOpen(v);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
          <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
            <Drawer.Title className="pb-1 text-xl font-bold">Excluir sua conta?</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Apagamos o salão, as clientes, a agenda, as conversas e o financeiro. O WhatsApp e o Google são
              desconectados. Não dá para desfazer.
            </Drawer.Description>
            <label className="grid gap-1 pb-4 text-sm font-bold">
              Digite {CONFIRM} para confirmar
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
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
                {busy ? "Excluindo…" : "Excluir minha conta"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="btn-glass flex min-h-13 items-center justify-center rounded-2xl px-5 font-bold"
              >
                Cancelar
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </section>
  );
}
