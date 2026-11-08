import { asc, eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { services } from "@/db/schema";
import type { ServiceInput } from "./schema";

export const listServices = (tx: Tx) =>
  tx.select().from(services).where(eq(services.active, true)).orderBy(asc(services.name));

export async function insertService(tx: Tx, tenantId: string, input: ServiceInput) {
  const [row] = await tx
    .insert(services)
    .values({ tenantId, name: input.name, durationMin: input.durationMin, priceCents: input.price })
    .returning({ id: services.id });
  return row;
}

/** RLS já limita ao salão: sem linha de volta, o serviço não é dela (ou não existe). */
export async function updateService(tx: Tx, id: string, input: ServiceInput) {
  const rows = await tx
    .update(services)
    .set({ name: input.name, durationMin: input.durationMin, priceCents: input.price })
    .where(eq(services.id, id))
    .returning({ id: services.id });
  return rows.length > 0;
}

/**
 * Remover só arquiva: agendamentos antigos apontam para o serviço e o histórico precisa do nome e do valor.
 * `active = true` desfaz.
 */
export async function setServiceActive(tx: Tx, id: string, active: boolean) {
  const rows = await tx.update(services).set({ active }).where(eq(services.id, id)).returning({ id: services.id });
  return rows.length > 0;
}
