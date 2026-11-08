import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { countPendencias } from "@/features/appointments/pendencias";
import { shellStatus } from "@/features/shell/status";
import { requireTenant } from "@/lib/tenant";
import { AppMenu } from "./AppMenu";

async function MenuWithData() {
  const { tenantId, userName } = await requireTenant();
  const [{ whatsapp, pendencias }, [tenant]] = await Promise.all([
    shellStatus(tenantId),
    getDb().select({ name: tenants.name }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  return (
    <AppMenu userName={userName} studioName={tenant?.name ?? null} whatsapp={whatsapp} pendencias={countPendencias(pendencias)} />
  );
}

export function HeaderMenu() {
  return (
    <Suspense fallback={<span aria-hidden="true" className="avatar size-11 shrink-0 rounded-full opacity-60" />}>
      <MenuWithData />
    </Suspense>
  );
}
