import { Suspense } from "react";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { listPendencias } from "@/features/appointments/pendencias";
import { isGoogleConnected } from "@/features/google/server";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { buildAvisos, pendenciaAvisos } from "@/features/notifications/core";
import { NotificationsSheet } from "@/features/notifications/NotificationsSheet";
import { currentState } from "@/features/whatsapp/core";
import { requireTenant } from "@/lib/tenant";
import { eq } from "drizzle-orm";

async function whatsappState(tenantId: string): Promise<"open" | "other" | "unavailable"> {
  const admin = adminFromEnv();
  if (!admin) return "unavailable";
  try {
    const [t] = await getDb().select({ i: tenants.whatsappInstance }).from(tenants).where(eq(tenants.id, tenantId));
    return (await currentState(admin, t?.i ?? null)) === "open" ? "open" : "other";
  } catch {
    return "unavailable";
  }
}

async function BellWithAvisos() {
  const { tenantId } = await requireTenant();
  const [google, whatsapp] = await Promise.all([isGoogleConnected(tenantId), whatsappState(tenantId)]);
  const p = await withTenant(tenantId, (tx) => listPendencias(tx, new Date(), google));
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
