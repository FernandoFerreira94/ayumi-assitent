import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { countPendencias } from "@/features/appointments/pendencias";
import { shellStatus } from "@/features/shell/status";
import { requireTenant } from "@/lib/tenant";

/** Dados do menu do avatar (celular) e do menu lateral (tablet/desktop). `cache`: uma consulta por pedido. */
export const getMenuData = cache(async () => {
  const { tenantId, userName } = await requireTenant();
  const [{ whatsapp, pendencias }, [tenant]] = await Promise.all([
    shellStatus(tenantId),
    getDb().select({ name: tenants.name, ownerName: tenants.ownerName }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  return {
    userName: tenant?.ownerName || userName,
    studioName: tenant?.name ?? null,
    whatsapp,
    pendencias: countPendencias(pendencias),
  };
});

export type MenuData = Awaited<ReturnType<typeof getMenuData>>;
