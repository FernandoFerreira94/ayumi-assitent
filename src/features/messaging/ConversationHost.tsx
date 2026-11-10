"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { loadChatClient } from "./actions";
import { ChatSheet } from "./ChatSheet";

/**
 * Abre a conversa com uma cliente por cima de qualquer tela quando o endereço tem `?conversa=<id>`: é para onde
 * levam a notificação no celular e os avisos do sino. Fechar tira o parâmetro sem recarregar a página.
 */
export function ConversationHost() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params.get("conversa");
  const [client, setClient] = useState<{ id: string; name: string; phone: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void loadChatClient(id)
      .catch(() => null)
      .then((res) => {
        if (!alive) return;
        if (res?.ok) setClient({ id, ...res.data });
        else {
          notify.error(res && !res.ok ? res.code : "NETWORK");
          router.replace(pathname, { scroll: false });
        }
      });
    return () => {
      alive = false;
    };
  }, [id, pathname, router]);

  if (!client || client.id !== id) return null;
  return (
    <ChatSheet
      clientId={client.id}
      clientName={client.name}
      phone={client.phone}
      open
      onOpenChange={(next) => {
        if (next) return;
        setClient(null);
        router.replace(pathname, { scroll: false });
      }}
    />
  );
}
