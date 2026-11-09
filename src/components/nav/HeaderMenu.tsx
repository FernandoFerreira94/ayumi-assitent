import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { countPendencias } from "@/features/appointments/pendencias";
import { shellStatus } from "@/features/shell/status";
import { requireTenant } from "@/lib/tenant";
// Default import: o bundler só garante o export default de JSON
import pkg from "../../../package.json";
import { AppMenu } from "./AppMenu";

async function MenuWithData() {
  const { tenantId, userName } = await requireTenant();
  const [{ whatsapp, pendencias }, [tenant]] = await Promise.all([
    shellStatus(tenantId),
    getDb().select({ name: tenants.name, ownerName: tenants.ownerName }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  return (
    <AppMenu
      userName={tenant?.ownerName || userName}
      studioName={tenant?.name ?? null}
      whatsapp={whatsapp}
      pendencias={countPendencias(pendencias)}
      version={pkg.version}
    />
  );
}

export function HeaderMenu() {
  return (
    <Suspense fallback={<span aria-hidden="true" className="avatar size-11 shrink-0 rounded-full opacity-60" />}>
      <MenuWithData />
    </Suspense>
  );
}
