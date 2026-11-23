import { and, asc, countDistinct, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, promotions, services } from "@/db/schema";
import type { Discount } from "@/features/appointments/pricing";
import { bestPromotion, promotionStatus, type PromotionDraft, type PromotionStatus } from "./promotion-rules";

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

/** Todas as promoções (as encerradas por último), com os serviços e quantas clientes usaram. */
export async function listPromotions(tx: Tx): Promise<PromotionRow[]> {
  const rows = await tx.select().from(promotions).orderBy(asc(promotions.createdAt));
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

/** Pausa ou retoma (só as não encerradas). false = não achou. */
export async function setPromotionPaused(tx: Tx, id: string, paused: boolean): Promise<boolean> {
  const r = await tx
    .update(promotions)
    .set({ paused })
    .where(and(eq(promotions.id, id), isNull(promotions.endedAt)))
    .returning({ id: promotions.id });
  return r.length > 0;
}

/** Encerra de vez (fica no histórico com quantas usaram). */
export async function endPromotion(tx: Tx, id: string): Promise<boolean> {
  const r = await tx
    .update(promotions)
    .set({ endedAt: new Date() })
    .where(and(eq(promotions.id, id), isNull(promotions.endedAt)))
    .returning({ id: promotions.id });
  return r.length > 0;
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
    .where(and(isNull(promotions.endedAt), eq(promotions.paused, false)));
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
