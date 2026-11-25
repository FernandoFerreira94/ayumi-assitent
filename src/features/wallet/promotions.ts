import { and, asc, countDistinct, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, promotions, services } from "@/db/schema";
import type { Discount } from "@/features/appointments/pricing";
import { bestPromotion, promotionStatus, type PromotionDraft, type PromotionStatus } from "./promotion-rules";
import type { DeleteOutcome } from "./rules";

/**
 * Promoções de desconto no agendamento (0054). Sempre dentro de `withTenant` (RLS). Aplicar no agendamento
 * só dentro do `lockTenant` de quem chama: a contagem de clientes e o limite são lidos ali.
 */

export type PromotionRow = {
  id: string;
  name: string | null;
  discount: Discount;
  serviceIds: string[];
  /** serviços com nome e preço de hoje (pausados ou excluídos somem) */
  services: { id: string; name: string; priceCents: number }[];
  startsOn: string | null;
  endsOn: string | null;
  maxClients: number | null;
  paused: boolean;
  ended: boolean;
  /** clientes que já usaram (atendimento não cancelado) */
  used: number;
  createdAt: Date;
};

/** Clientes distintas que usaram cada promoção (cancelado libera a vaga). */
async function usedBy(tx: Tx, ids: string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map();
  const rows = await tx
    .select({ id: appointments.promotionId, n: countDistinct(appointments.clientId) })
    .from(appointments)
    .where(and(inArray(appointments.promotionId, ids), ne(appointments.status, "cancelled")))
    .groupBy(appointments.promotionId);
  return new Map(rows.map((r) => [r.id!, Number(r.n)]));
}

/** Promoções não excluídas, com os serviços e quantas clientes usaram. */
export async function listPromotions(tx: Tx): Promise<PromotionRow[]> {
  const rows = await tx
    .select()
    .from(promotions)
    .where(isNull(promotions.deletedAt))
    .orderBy(asc(promotions.createdAt));
  if (!rows.length) return [];
  const ids = [...new Set(rows.flatMap((r) => r.serviceIds))];
  const [svcs, used] = await Promise.all([
    tx
      .select({ id: services.id, name: services.name, priceCents: services.priceCents })
      .from(services)
      .where(and(inArray(services.id, ids), eq(services.active, true))),
    usedBy(
      tx,
      rows.map((r) => r.id),
    ),
  ]);
  const byId = new Map(svcs.map((x) => [x.id, x]));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    discount: { kind: r.discountKind, value: r.discountValue },
    serviceIds: r.serviceIds,
    services: r.serviceIds.flatMap((id) => byId.get(id) ?? []),
    startsOn: r.startsOn,
    endsOn: r.endsOn,
    maxClients: r.maxClients,
    paused: r.paused,
    ended: r.endedAt !== null,
    used: used.get(r.id) ?? 0,
    createdAt: r.createdAt,
  }));
}

/** Cria a promoção. null = algum serviço não é do salão ou está pausado. */
export async function createPromotion(tx: Tx, tenantId: string, d: PromotionDraft): Promise<string | null> {
  const svcs = await tx
    .select({ id: services.id })
    .from(services)
    .where(and(inArray(services.id, d.serviceIds), eq(services.active, true)));
  if (svcs.length !== d.serviceIds.length) return null;
  const [row] = await tx
    .insert(promotions)
    .values({
      tenantId,
      name: d.name,
      discountKind: d.discount.kind,
      discountValue: d.discount.value,
      serviceIds: d.serviceIds,
      startsOn: d.startsOn,
      endsOn: d.endsOn,
      maxClients: d.maxClients,
    })
    .returning({ id: promotions.id });
  return row?.id ?? null;
}

/** Desativa ou reativa (reativar também tira o antigo "Encerrar"). false = não achou ou foi excluída. */
export async function setPromotionPaused(tx: Tx, id: string, paused: boolean): Promise<boolean> {
  const r = await tx
    .update(promotions)
    .set(paused ? { paused } : { paused, endedAt: null })
    .where(and(eq(promotions.id, id), isNull(promotions.deletedAt)))
    .returning({ id: promotions.id });
  return r.length > 0;
}

/**
 * Edita a promoção (desconto, serviços, período, limite, nome). Quem já usou guarda o desconto em R$ no próprio
 * agendamento, então nada muda para trás. null = não achou; false = algum serviço não é do salão ou está pausado.
 */
export async function updatePromotion(tx: Tx, id: string, d: PromotionDraft): Promise<boolean | null> {
  const svcs = await tx
    .select({ id: services.id })
    .from(services)
    .where(and(inArray(services.id, d.serviceIds), eq(services.active, true)));
  if (svcs.length !== d.serviceIds.length) return false;
  const r = await tx
    .update(promotions)
    .set({
      name: d.name,
      discountKind: d.discount.kind,
      discountValue: d.discount.value,
      serviceIds: d.serviceIds,
      startsOn: d.startsOn,
      endsOn: d.endsOn,
      maxClients: d.maxClients,
    })
    .where(and(eq(promotions.id, id), isNull(promotions.deletedAt)))
    .returning({ id: promotions.id });
  return r.length ? true : null;
}

/**
 * Excluir (a dona digitou "excluir"). Nunca usada em agendamento (nem cancelado): apaga de vez. Já usada: some
 * da lista e para de valer (`deleted_at`); os agendamentos guardam o desconto e a ligação. null = não achou.
 */
export async function deletePromotion(tx: Tx, id: string): Promise<DeleteOutcome | null> {
  const [used] = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.promotionId, id))
    .limit(1);
  if (!used) {
    const r = await tx.delete(promotions).where(eq(promotions.id, id)).returning({ id: promotions.id });
    return r.length ? "deleted" : null;
  }
  const r = await tx
    .update(promotions)
    .set({ deletedAt: new Date(), paused: true })
    .where(and(eq(promotions.id, id), isNull(promotions.deletedAt)))
    .returning({ id: promotions.id });
  return r.length ? "archived" : null;
}

export type PickedPromotion = {
  id: string;
  name: string | null;
  offCents: number;
  /** clientes com esta, contando a de agora */
  used: number;
  maxClients: number | null;
};

/**
 * Promoção que entra neste agendamento: valendo hoje, cobre algum serviço, a cliente ainda não usou e tem vaga.
 * Com mais de uma, a de maior desconto. Chame dentro do `lockTenant` (a vaga é contada aqui).
 */
export async function pickPromotion(
  tx: Tx,
  input: { clientId: string; booked: { id: string; priceCents: number }[]; today: string },
): Promise<PickedPromotion | null> {
  const rows = await tx
    .select()
    .from(promotions)
    .where(and(isNull(promotions.endedAt), isNull(promotions.deletedAt), eq(promotions.paused, false)));
  if (!rows.length) return null;
  const ids = rows.map((r) => r.id);
  const [used, mine] = await Promise.all([
    usedBy(tx, ids),
    tx
      .selectDistinct({ id: appointments.promotionId })
      .from(appointments)
      .where(
        and(
          eq(appointments.clientId, input.clientId),
          isNotNull(appointments.promotionId),
          inArray(appointments.promotionId, ids),
          ne(appointments.status, "cancelled"),
        ),
      ),
  ]);
  const usedMine = new Set(mine.map((m) => m.id));
  const open = rows
    .filter((r) => !usedMine.has(r.id))
    .map((r) => ({
      ...r,
      discount: { kind: r.discountKind, value: r.discountValue } as Discount,
      ended: false,
      status: promotionStatus(
        { startsOn: r.startsOn, endsOn: r.endsOn, maxClients: r.maxClients, paused: r.paused, ended: false },
        input.today,
        used.get(r.id) ?? 0,
      ) as PromotionStatus,
    }))
    .filter((r) => r.status === "running");
  const best = bestPromotion(open, input.booked);
  if (!best) return null;
  return {
    id: best.promo.id,
    name: best.promo.name,
    offCents: best.offCents,
    used: (used.get(best.promo.id) ?? 0) + 1,
    maxClients: best.promo.maxClients,
  };
}
