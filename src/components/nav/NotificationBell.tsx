import { Suspense } from "react";
import { withTenant } from "@/db/client";
import { listUnread } from "@/features/messaging/store";
import { buildAvisos, messageAvisos, pendenciaAvisos } from "@/features/notifications/core";
import { NotificationsSheet } from "@/features/notifications/NotificationsSheet";
import { shellStatus } from "@/features/shell/status";
import { requireTenant } from "@/lib/tenant";

async function BellWithAvisos() {
  const { tenantId } = await requireTenant();
  const [{ google, whatsapp, pendencias: p }, unread] = await Promise.all([
    shellStatus(tenantId),
    withTenant(tenantId, (tx) => listUnread(tx)),
  ]);
  const avisos = [
    // Resposta de cliente primeiro: é o que pede ação agora
    ...messageAvisos(unread),
    ...pendenciaAvisos({
      toClose: p.toClose.length,
      toConfirm: p.toConfirm.length,
      unsynced: p.unsynced.length,
      toReschedule: p.toReschedule.length,
    }),
    ...buildAvisos({ whatsapp, google }),
  ];
  return <NotificationsSheet avisos={avisos} />;
}

export function NotificationBell() {
  return (
    <Suspense fallback={<NotificationsSheet avisos={[]} />}>
      <BellWithAvisos />
    </Suspense>
  );
}
