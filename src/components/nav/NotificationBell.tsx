import { Suspense } from "react";
import { withTenant } from "@/db/client";
import { listUnread } from "@/features/messaging/store";
import { buildAvisos, messageAvisos, noReplyAvisos } from "@/features/notifications/core";
import { NotificationsSheet } from "@/features/notifications/NotificationsSheet";
import { listNoReplies } from "@/features/reminders/no-reply";
import { whatsappState } from "@/features/shell/status";
import { requireTenant } from "@/lib/tenant";

/**
 * O sino só fala da resposta da cliente: confirmou, quer cancelar, quer remarcar ou não respondeu (pedido da
 * dona). A única exceção é o WhatsApp desconectado, porque sem ele nenhum aviso sai. O resto fica em Pendências.
 */
async function BellWithAvisos() {
  const { tenantId } = await requireTenant();
  const now = new Date();
  const [whatsapp, unread, noReply] = await Promise.all([
    whatsappState(tenantId),
    withTenant(tenantId, (tx) => listUnread(tx)),
    withTenant(tenantId, (tx) => listNoReplies(tx, now)),
  ]);
  const avisos = [...messageAvisos(unread), ...noReplyAvisos(noReply), ...buildAvisos({ whatsapp, google: true })];
  return <NotificationsSheet avisos={avisos} />;
}

export function NotificationBell() {
  return (
    <Suspense fallback={<NotificationsSheet avisos={[]} />}>
      <BellWithAvisos />
    </Suspense>
  );
}
