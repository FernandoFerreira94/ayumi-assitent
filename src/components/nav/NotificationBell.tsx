import { Suspense } from "react";
import { buildAvisos, pendenciaAvisos } from "@/features/notifications/core";
import { NotificationsSheet } from "@/features/notifications/NotificationsSheet";
import { shellStatus } from "@/features/shell/status";
import { requireTenant } from "@/lib/tenant";

async function BellWithAvisos() {
  const { tenantId } = await requireTenant();
  const { google, whatsapp, pendencias: p } = await shellStatus(tenantId);
  const avisos = [
    ...pendenciaAvisos({ toClose: p.toClose.length, toConfirm: p.toConfirm.length, unsynced: p.unsynced.length }),
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
