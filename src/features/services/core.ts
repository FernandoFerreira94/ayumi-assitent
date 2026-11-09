import { and, asc, count, eq, gte, max, ne } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, services } from "@/db/schema";
import type { ServiceInput } from "./schema";

// Mesma ordem em toda tela: a ordem arrastada na lista de Serviços
const catalogOrder = [asc(services.position), asc(services.name)] as const;

/** Serviços não excluídos, pausados inclusive. */
export const listServices = (tx: Tx) =>
  tx
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(...catalogOrder);

/** O que pode entrar num agendamento novo (fora os pausados). */
export const listBookable = async (tx: Tx) => (await listServices(tx)).filter((s) => s.bookable);

/** Atendimentos marcados de agora em diante, por serviço. */
export async function upcomingByService(tx: Tx, now = new Date()) {
  const rows = await tx
    .select({ serviceId: appointments.serviceId, n: count() })
    .from(appointments)
    .where(and(gte(appointments.startsAt, now), ne(appointments.status, "cancelled")))
    .groupBy(appointments.serviceId);
  return new Map(rows.map((r) => [r.serviceId, r.n]));
}

const fields = (input: Omit<ServiceInput, "color"> & { color: string }) => ({
  name: input.name,
  durationMin: input.durationMin,
  priceCents: input.price,
  priceFrom: input.priceFrom,
  bufferMin: input.bufferMin,
  color: input.color,
  notes: input.notes,
  bookable: input.bookable,
  showInSlots: input.showInSlots,
});

async function nextPosition(tx: Tx) {
  const [row] = await tx.select({ p: max(services.position) }).from(services);
  return (row?.p ?? 0) + 1;
}

export async function insertService(tx: Tx, tenantId: string, input: ServiceInput) {
  const [row] = await tx
    .insert(services)
    .values({ tenantId, ...fields(input), position: await nextPosition(tx) })
    .returning({ id: services.id });
  return row;
}

/** RLS já limita ao salão: sem linha de volta, o serviço não é dela (ou não existe). */
export async function updateService(tx: Tx, id: string, input: ServiceInput) {
  const rows = await tx.update(services).set(fields(input)).where(eq(services.id, id)).returning({ id: services.id });
  return rows.length > 0;
}

/** Cópia logo abaixo do original, com "(cópia)" no nome. */
export async function duplicateService(tx: Tx, tenantId: string, id: string) {
  const [src] = await tx
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.active, true)));
  if (!src) return null;
  // abre espaço logo depois do original
  const all = await listServices(tx);
  const at = all.findIndex((s) => s.id === id);
  const order = all.map((s) => s.id);
  const [row] = await tx
    .insert(services)
    .values({
      ...fields({ ...src, price: src.priceCents }),
      tenantId,
      name: `${src.name} (cópia)`.slice(0, 60),
    })
    .returning({ id: services.id });
  order.splice(at + 1, 0, row.id);
  await reorderServices(tx, order);
  return row;
}

/**
 * Excluir só arquiva: agendamentos antigos apontam para o serviço e o histórico precisa do nome e do valor.
 * Os marcados daqui para frente continuam. `active = true` desfaz.
 */
export async function setServiceActive(tx: Tx, id: string, active: boolean) {
  const rows = await tx.update(services).set({ active }).where(eq(services.id, id)).returning({ id: services.id });
  return rows.length > 0;
}

/** `ids` na nova ordem; poucas dezenas de linhas, então uma atualização por serviço basta. */
export async function reorderServices(tx: Tx, ids: string[]) {
  for (const [i, id] of ids.entries())
    await tx
      .update(services)
      .set({ position: i + 1 })
      .where(eq(services.id, id));
}
