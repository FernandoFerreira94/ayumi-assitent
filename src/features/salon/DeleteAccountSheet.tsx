"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notify } from "@/components/feedback/toast";
import { TypeToConfirmSheet } from "@/components/ui/TypeToConfirmSheet";
import { authClient } from "@/lib/auth-client";
import { deleteAccount } from "./actions";

const CONFIRM = "EXCLUIR";

/** Excluir minha conta (LGPD): folha por cima de Meu perfil, só libera depois de digitar EXCLUIR. */
export function DeleteAccountSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function confirm(text: string): Promise<boolean> {
    const res = await deleteAccount(text).catch(() => null);
    if (!res?.ok) {
      notify.error(res && !res.ok ? res.code : "NETWORK", () => void confirm(text));
      return false;
    }
    await authClient.signOut().catch(() => undefined);
    notify.success("Conta excluída. Seus dados foram apagados.");
    router.replace("/login");
    router.refresh();
    return true;
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
      <TypeToConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title="Excluir sua conta?"
        description="Apagamos o salão, as clientes, a agenda, as conversas e o financeiro. O WhatsApp e o Google são desconectados. Não dá para desfazer."
        word={CONFIRM}
        confirmLabel="Excluir minha conta"
        onConfirm={confirm}
      />
    </section>
  );
}
