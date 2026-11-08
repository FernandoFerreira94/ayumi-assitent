import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { listPendencias } from "@/features/appointments/pendencias";
import { isGoogleConnected } from "@/features/google/server";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { currentState } from "@/features/whatsapp/core";

export type WhatsAppState = "open" | "other" | "unavailable";

export async function whatsappState(tenantId: string): Promise<WhatsAppState> {
  const admin = adminFromEnv();
  if (!admin) return "unavailable";
  try {
    const [t] = await getDb().select({ i: tenants.whatsappInstance }).from(tenants).where(eq(tenants.id, tenantId));
    return (await currentState(admin, t?.i ?? null)) === "open" ? "open" : "other";
  } catch {
    return "unavailable";
  }
}

/** O sino e o menu do avatar mostram o mesmo estado: cache() faz uma consulta só por pedido. */
export const shellStatus = cache(async (tenantId: string) => {
  const [google, whatsapp] = await Promise.all([isGoogleConnected(tenantId), whatsappState(tenantId)]);
  const pendencias = await withTenant(tenantId, (tx) => listPendencias(tx, new Date(), google));
  return { google, whatsapp, pendencias };
});
