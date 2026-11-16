import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { listPendencias } from "@/features/appointments/pendencias";
import { connectedProfessionalIds, isGoogleConnected } from "@/features/google/server";
import { calendarProfessionalId } from "@/features/team/professional";
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

/**
 * O sino e o menu do avatar mostram o mesmo estado: cache() faz uma consulta só por pedido.
 * `google` é o Google de quem está logado (a profissional dele; owner/admin sem ligação: a padrão);
 * as pendências de sincronização olham todas as profissionais conectadas do salão.
 */
export const shellStatus = cache(async (tenantId: string, professionalId: string | null) => {
  const viewer = await calendarProfessionalId({ tenantId, professionalId });
  const [google, googleProfessionals, whatsapp] = await Promise.all([
    isGoogleConnected(viewer),
    connectedProfessionalIds(tenantId),
    whatsappState(tenantId),
  ]);
  const pendencias = await withTenant(tenantId, (tx) => listPendencias(tx, new Date(), googleProfessionals));
  return { google, whatsapp, pendencias };
});
