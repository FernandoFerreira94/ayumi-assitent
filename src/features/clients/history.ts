import { and, desc, eq, inArray, isNotNull, isNull, sql, type AnyColumn } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clientLedger, clientPackages, clients, promotions, services } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
import type { Status } from "@/features/appointments/schema";
import { clientMoves, paidCentsSql } from "@/features/wallet/core";
import { clientPackageList } from "@/features/wallet/packages";
import { walletBalance } from "@/features/wallet/rules";
import { HISTORY_PAGE, MONEY_KINDS, mergePage, type Cursor, type HistoryFilter, type MoneyKind } from "./history-rules";

export type VisitEvent = {
  type: "visit";
  id: string;
  at: Date;
  status: Status;
  service: string;
  priceCents: number;
  discountCents: number;
  paidCents: number;
  depositRequestedCents: number | null;
  packageName: string | null;
  promotionName: string | null;
  notes: string | null;
};
export type PackageEvent = {
  type: "package";
  id: string;
  at: Date;
  name: string;
  sessionsTotal: number;
  priceCents: number;
  expiresOn: string | null;
};
export type MoneyEvent = {
  type: "money";
  id: string;
  at: Date;
  kind: MoneyKind;
  amountCents: number;
  method: "pix" | "dinheiro" | "cartao" | null;
  reason: string | null;
  appointmentPriceCents: number | null;
  appointmentAt: Date | null;
  packageName: string | null;
};
export type HistoryEvent = VisitEvent | PackageEvent | MoneyEvent;

/** Antes do cursor na ordem "mais novo primeiro" (instante, depois id). */
const before = (at: AnyColumn, id: AnyColumn, c: Cursor | null) =>
  c ? sql`(${at}, ${id}) < (${c.at.toISOString()}::timestamptz, ${c.id}::uuid)` : undefined;

function visits(tx: Tx, clientId: string, filter: HistoryFilter, c: Cursor | null, limit: number) {
  const where = and(
    eq(appointments.clientId, clientId),
    before(appointments.startsAt, appointments.id, c),
    filter === "no_show" ? eq(appointments.status, "no_show") : undefined,
    filter === "plans" ? isNotNull(appointments.clientPackageId) : undefined,
  );
  return tx
    .select({
      id: appointments.id,
      at: appointments.startsAt,
      status: appointments.status,
      service: serviceLabel,
      priceCents: appointments.priceCents,
      discountCents: appointments.discountCents,
      paidCents: paidCentsSql,
      depositRequestedCents: appointments.depositRequestedCents,
      packageName: clientPackages.name,
      promotionName: promotions.name,
      notes: appointments.notes,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .leftJoin(clientPackages, eq(clientPackages.id, appointments.clientPackageId))
    .leftJoin(promotions, eq(promotions.id, appointments.promotionId))
    .where(where)
    .orderBy(desc(appointments.startsAt), desc(appointments.id))
    .limit(limit)
    .then((rows) => rows.map((r): VisitEvent => ({ type: "visit", ...r, status: r.status as Status })));
}

function packages(tx: Tx, clientId: string, c: Cursor | null, limit: number) {
  return tx
    .select({
      id: clientPackages.id,
      at: clientPackages.createdAt,
      name: clientPackages.name,
      sessionsTotal: clientPackages.sessionsTotal,
      priceCents: clientPackages.priceCents,
      expiresOn: clientPackages.expiresOn,
    })
    .from(clientPackages)
    .where(and(eq(clientPackages.clientId, clientId), before(clientPackages.createdAt, clientPackages.id, c)))
    .orderBy(desc(clientPackages.createdAt), desc(clientPackages.id))
    .limit(limit)
    .then((rows) => rows.map((r): PackageEvent => ({ type: "package", ...r })));
}

/**
 * Dinheiro da cliente. Anulações somem junto com o movimento anulado (os dois juntos dão zero).
 * `standaloneOnly`: só o que não pertence a um atendimento nem a uma venda de pacote (esses aparecem no próprio item).
 */
function money(tx: Tx, clientId: string, standaloneOnly: boolean, c: Cursor | null, limit: number) {
  return tx
    .select({
      id: clientLedger.id,
      at: clientLedger.occurredAt,
      kind: clientLedger.kind,
      amountCents: clientLedger.amountCents,
      method: clientLedger.method,
      reason: clientLedger.reason,
      appointmentPriceCents: appointments.priceCents,
      appointmentAt: appointments.startsAt,
      packageName: clientPackages.name,
    })
    .from(clientLedger)
    .leftJoin(appointments, eq(appointments.id, clientLedger.appointmentId))
    .leftJoin(clientPackages, eq(clientPackages.id, clientLedger.clientPackageId))
    .where(
      and(
        eq(clientLedger.clientId, clientId),
        inArray(clientLedger.kind, [...MONEY_KINDS]),
        isNull(clientLedger.reversesId),
        sql`not exists (select 1 from client_ledger r where r.reverses_id = ${clientLedger.id})`,
        standaloneOnly ? and(isNull(clientLedger.appointmentId), isNull(clientLedger.clientPackageId)) : undefined,
        before(clientLedger.occurredAt, clientLedger.id, c),
      ),
    )
    .orderBy(desc(clientLedger.occurredAt), desc(clientLedger.id))
    .limit(limit)
    .then((rows) => rows.map((x): MoneyEvent => ({ type: "money", ...x, kind: x.kind as MoneyKind })));
}

/** Uma página da linha do tempo da cliente, do mais novo ao mais velho. */
export async function clientHistoryPage(
  tx: Tx,
  clientId: string,
  filter: HistoryFilter,
  cursor: Cursor | null,
  size = HISTORY_PAGE,
): Promise<{ items: HistoryEvent[]; next: string | null }> {
  const limit = size + 1;
  const lists: Promise<HistoryEvent[]>[] = [];
  if (filter !== "payments") lists.push(visits(tx, clientId, filter, cursor, limit));
  if (filter === "all" || filter === "plans") lists.push(packages(tx, clientId, cursor, limit));
  if (filter === "all" || filter === "payments") lists.push(money(tx, clientId, filter === "all", cursor, limit));
  return mergePage(await Promise.all(lists), size);
}

export type HistorySummary = {
  since: Date | null;
  done: number;
  noShows: number;
  cancelled: number;
  spentCents: number;
  lastVisit: Date | null;
  next: Date | null;
  creditCents: number;
  plans: { name: string; left: number; total: number; expiresOn: string | null }[];
};

/** Resumo do topo do histórico (números grandes). `null` = cliente não existe neste salão. */
export async function clientHistorySummary(
  tx: Tx,
  clientId: string,
  today: string,
  now = new Date(),
): Promise<HistorySummary | null> {
  const [client] = await tx
    .select({ createdAt: clients.createdAt })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return null;
  const at = now.toISOString();
  const [[t], moves, pkgs] = await Promise.all([
    tx
      .select({
        done: sql<number>`count(*) filter (where ${appointments.status} = 'done')`.mapWith(Number),
        noShows: sql<number>`count(*) filter (where ${appointments.status} = 'no_show')`.mapWith(Number),
        cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')`.mapWith(Number),
        spent:
          sql<number>`coalesce(sum(${appointments.priceCents}) filter (where ${appointments.status} = 'done'), 0)`.mapWith(
            Number,
          ),
        first: sql<string | null>`min(${appointments.startsAt})`,
        last: sql<string | null>`max(${appointments.startsAt}) filter (where ${appointments.status} = 'done')`,
        next: sql<
          string | null
        >`min(${appointments.startsAt}) filter (where ${appointments.status} not in ('cancelled', 'done', 'no_show') and ${appointments.startsAt} >= ${at}::timestamptz)`,
      })
      .from(appointments)
      .where(eq(appointments.clientId, clientId)),
    clientMoves(tx, clientId),
    clientPackageList(tx, clientId, today),
  ]);
  const date = (v: string | null | undefined) => (v ? new Date(v) : null);
  const first = date(t?.first);
  return {
    since: first && first < client.createdAt ? first : client.createdAt,
    done: t?.done ?? 0,
    noShows: t?.noShows ?? 0,
    cancelled: t?.cancelled ?? 0,
    spentCents: t?.spent ?? 0,
    lastVisit: date(t?.last),
    next: date(t?.next),
    creditCents: walletBalance(moves),
    plans: pkgs
      .filter((p) => p.left > 0 && !p.expired)
      .map((p) => ({ name: p.name, left: p.left, total: p.sessionsTotal, expiresOn: p.expiresOn })),
  };
}
