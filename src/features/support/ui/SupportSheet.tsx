"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Drawer } from "vaul";
import { sheetClass, SidePanelClose, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { markSupportSeen, replySupport } from "../admin-actions";
import { MarkRead, SupportThread, type ThreadMessage } from "./SupportThread";

/** Conversa com um salão no /admin (folha no celular, painel à direita no desktop). Abre pelo ?salao=. */
export function SupportSheet({
  tenantId,
  salonName,
  messages,
  hasUnread,
}: {
  tenantId: string | null;
  salonName: string;
  messages: ThreadMessage[];
  hasUnread: boolean;
}) {
  const side = useSheetSide();
  const router = useRouter();
  const pathname = usePathname();
  const send = useCallback((body: string) => replySupport({ tenantId: tenantId ?? "", body }), [tenantId]);
  const seen = useCallback(() => markSupportSeen(tenantId ?? ""), [tenantId]);

  return (
    <Drawer.Root
      direction={side}
      open={Boolean(tenantId)}
      onOpenChange={(open) => !open && router.replace(pathname, { scroll: false })}
      repositionInputs={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto h-[88dvh] max-w-[520px] rounded-t-3xl pt-4 outline-none", "sheet z-50 flex flex-col")}
        >
          <SidePanelClose />
          {tenantId ? (
            <>
              {hasUnread ? <MarkRead key={tenantId} run={seen} /> : null}
              <div className="px-5 md:px-0">
                <Drawer.Title className="pr-12 text-xl font-bold">{salonName}</Drawer.Title>
                <Drawer.Description className="pb-3 text-sm font-semibold text-muted">
                  A resposta chega no app e no celular do salão.
                </Drawer.Description>
              </div>
              <SupportThread
                me="admin"
                label={`Resposta para ${salonName}`}
                send={send}
                empty={{ title: "Sem mensagens", text: "Este salão ainda não escreveu." }}
                messages={messages}
                className="mx-3 mb-[max(env(safe-area-inset-bottom),12px)] flex-1 bg-bg md:mx-0"
              />
            </>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
