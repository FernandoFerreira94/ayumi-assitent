import { and, asc, countDistinct, eq, inArray, sql, type Column, type SQL } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { clientLedger, clientPackages, packageTemplates, services } from "@/db/schema";
import type { PaymentMethod } from "@/features/appointments/payment";
import { getWalletSettings } from "./core";
import {
  packageExpiresOn,
  packagePrice,
  packageSessionsLeft,
  promoStatus,
  referenceService,
  type PackageDraft,
} from "./rules";
import { chooseSession, type PickedSession } from "./session-use";

/**
 * Pacotes (carteira, PR 4): modelos do salão, venda para a cliente e sessões no extrato.
 * Sempre dentro de `withTenant` (RLS); vender e reservar sessão dentro do `lockTenant` de quem chama.
 */

export type TemplateService = { id: string; name: string; priceCents: number };

export type TemplateRow = {
  id: string;
  kind: "pay_x" | "sessions";
  name: string;
  /** serviço de referência do preço (o mais caro da lista) */
  serviceId: string;
  serviceName: string;
  servicePriceCents: number;
  serviceIds: string[];
  /** serviços do pacote, com nome e preço de hoje (os pausados ou excluídos somem da lista) */
  services: TemplateService[];
  sessionsPaid: number | null;
  sessionsTotal: number;
  priceCents: number;
  validDays: number | null;
  startsOn: string | null;
  endsOn: string | null;
  maxClients: number | null;
  /** clientes que já compraram */
  soldClients: number;
  /** venda pausada */
  paused: boolean;
};

/** Modelos ativos, com os serviços (nome e preço de hoje) e quantas clientes já compraram. */
export async function listTemplates(tx: Tx): Promise<TemplateRow[]> {
  const rows = await tx
    .select({
      id: packageTemplates.id,
      kind: packageTemplates.kind,
      name: packageTemplates.name,
      serviceId: packageTemplates.serviceId,
      serviceName: services.name,
      servicePriceCents: services.priceCents,
      serviceIds: packageTemplates.serviceIds,
      sessionsPaid: packageTemplates.sessionsPaid,
      sessionsTotal: packageTemplates.sessionsTotal,
      priceCents: packageTemplates.priceCents,
      validDays: packageTemplates.validDays,
      startsOn: packageTemplates.startsOn,
      endsOn: packageTemplates.endsOn,
      maxClients: packageTemplates.maxClients,
      paused: packageTemplates.paused,
    })
    .from(packageTemplates)
    .innerJoin(services, eq(services.id, packageTemplates.serviceId))
    .where(eq(packageTemplates.active, true))
    .orderBy(asc(packageTemplates.createdAt));
  if (!rows.length) return [];
  const ids = [...new Set(rows.flatMap((r) => r.serviceIds))];
  const [svcs, sold] = await Promise.all([
    tx
      .select({ id: services.id, name: services.name, priceCents: services.priceCents })
      .from(services)
      .where(and(inArray(services.id, ids), eq(services.active, true))),
    tx
      .select({ templateId: clientPackages.templateId, n: countDistinct(clientPackages.clientId) })
      .from(clientPackages)
      .where(
        inArray(
          clientPackages.templateId,
          rows.map((r) => r.id),
        ),
      )
      .groupBy(clientPackages.templateId),
  ]);
  const byId = new Map(svcs.map((x) => [x.id, x]));
  const soldBy = new Map(sold.map((x) => [x.templateId, Number(x.n)]));
  return rows.map((r) => ({
    ...r,
    services: r.serviceIds.flatMap((id) => byId.get(id) ?? []),
    soldClients: soldBy.get(r.id) ?? 0,
  }));
}

/**
 * Cria o modelo. O serviço de referência é o mais caro da lista; "Pague X, leve Y" grava o preço de hoje
 * (X × esse serviço) e a venda recalcula. null = algum serviço não é do salão ou está pausado.
 */
export async function createTemplate(tx: Tx, tenantId: string, d: PackageDraft): Promise<string | null> {
  const svcs = await tx
    .select({ id: services.id, priceCents: services.priceCents })
    .from(services)
    .where(and(inArray(services.id, d.serviceIds), eq(services.active, true)));
  const ref = referenceService(svcs);
  if (!ref || svcs.length !== d.serviceIds.length) return null;
  const [row] = await tx
    .insert(packageTemplates)
    .values({
      tenantId,
      kind: d.kind,
      name: d.name,
      serviceId: ref.id,
      serviceIds: d.serviceIds,
      sessionsPaid: d.sessionsPaid,
      sessionsTotal: d.sessionsTotal,
      priceCents: packagePrice(d, ref.priceCents),
      startsOn: d.startsOn,
      endsOn: d.endsOn,
      maxClients: d.maxClients,
    })
    .returning({ id: packageTemplates.id });
  return row?.id ?? null;
}

/** Tira o modelo da lista de venda (os pacotes já vendidos continuam valendo). */
export const archiveTemplate = (tx: Tx, id: string) =>
  tx.update(packageTemplates).set({ active: false }).where(eq(packageTemplates.id, id));

/** Pausa ou retoma a venda do pacote (continua na lista). */
export async function setTemplatePaused(tx: Tx, id: string, paused: boolean): Promise<boolean> {
  const r = await tx
    .update(packageTemplates)
    .set({ paused })
    .where(and(eq(packageTemplates.id, id), eq(packageTemplates.active, true)))
    .returning({ id: packageTemplates.id });
  return r.length > 0;
}

export type SellRefusal = "not_found" | "scheduled" | "ended" | "sold_out" | "already_bought" | "paused";

/**
 * Vende um pacote para a cliente: copia o modelo, dá as sessões e grava o pagamento (entra no caixa do dia,
 * não nos Ganhos nem no crédito). Validade: a do modelo ou a padrão de Ajustes > Pagamentos.
 * Promoção: só no período; com limite, cada cliente compra 1 vez e esgota nas N primeiras.
 * Chame dentro do `lockTenant` (o limite é contado aqui).
 */
export async function sellPackage(
  tx: Tx,
  input: {
    tenantId: string;
    clientId: string;
    templateId: string;
    method: PaymentMethod | null;
    today: string;
    createdBy?: string | null;
  },
): Promise<
  | { ok: true; id: string; name: string; priceCents: number; sessions: number; expiresOn: string }
  | { ok: false; reason: SellRefusal }
> {
  const [t] = await tx
    .select({
      kind: packageTemplates.kind,
      name: packageTemplates.name,
      serviceId: packageTemplates.serviceId,
      serviceIds: packageTemplates.serviceIds,
      sessionsPaid: packageTemplates.sessionsPaid,
      sessionsTotal: packageTemplates.sessionsTotal,
      priceCents: packageTemplates.priceCents,
      validDays: packageTemplates.validDays,
      startsOn: packageTemplates.startsOn,
      endsOn: packageTemplates.endsOn,
      maxClients: packageTemplates.maxClients,
      paused: packageTemplates.paused,
      servicePriceCents: services.priceCents,
    })
    .from(packageTemplates)
    .innerJoin(services, eq(services.id, packageTemplates.serviceId))
    .where(and(eq(packageTemplates.id, input.templateId), eq(packageTemplates.active, true)));
  if (!t) return { ok: false, reason: "not_found" };
  if (t.maxClients !== null) {
    const buyers = await tx
      .selectDistinct({ clientId: clientPackages.clientId })
      .from(clientPackages)
      .where(eq(clientPackages.templateId, input.templateId));
    if (buyers.some((b) => b.clientId === input.clientId)) return { ok: false, reason: "already_bought" };
    const status = promoStatus(t, input.today, buyers.length);
    if (status !== "running") return { ok: false, reason: status };
  } else {
    const status = promoStatus(t, input.today, 0);
    if (status !== "running") return { ok: false, reason: status };
  }
  const price = packagePrice(t, t.servicePriceCents);
  const days = t.validDays ?? (await getWalletSettings(tx)).packageValidDays;
  const expiresOn = packageExpiresOn(input.today, days);
  const [p] = await tx
    .insert(clientPackages)
    .values({
      tenantId: input.tenantId,
      clientId: input.clientId,
      templateId: input.templateId,
      name: t.name,
      serviceId: t.serviceId,
      serviceIds: t.serviceIds,
      sessionsTotal: t.sessionsTotal,
      priceCents: price,
      soldOn: input.today,
      expiresOn,
      createdBy: input.createdBy ?? null,
    })
    .returning({ id: clientPackages.id });
  const base = {
    tenantId: input.tenantId,
    clientId: input.clientId,
    clientPackageId: p!.id,
    createdBy: input.createdBy ?? null,
  };
  await tx
    .insert(clientLedger)
    .values([
      { ...base, kind: "session_grant" as const, sessions: t.sessionsTotal, reason: `Pacote ${t.name}` },
      ...(price > 0
        ? [{ ...base, kind: "payment" as const, amountCents: price, method: input.method, reason: `Pacote ${t.name}` }]
        : []),
    ]);
  return { ok: true, id: p!.id, name: t.name, priceCents: price, sessions: t.sessionsTotal, expiresOn };
}

export type ClientPackage = {
  id: string;
  name: string;
  serviceId: string;
  serviceIds: string[];
  sessionsTotal: number;
  priceCents: number;
  expiresOn: string | null;
  left: number;
  expired: boolean;
};

/** Pacotes da cliente com as sessões que restam. */
export async function clientPackageList(tx: Tx, clientId: string, today: string): Promise<ClientPackage[]> {
  const pkgs = await tx
    .select({
      id: clientPackages.id,
      name: clientPackages.name,
      serviceId: clientPackages.serviceId,
      serviceIds: clientPackages.serviceIds,
      sessionsTotal: clientPackages.sessionsTotal,
      priceCents: clientPackages.priceCents,
      expiresOn: clientPackages.expiresOn,
    })
    .from(clientPackages)
    .where(eq(clientPackages.clientId, clientId))
    .orderBy(asc(clientPackages.expiresOn), asc(clientPackages.createdAt));
  if (!pkgs.length) return [];
  const moves = await tx
    .select({
      kind: clientLedger.kind,
      amountCents: clientLedger.amountCents,
      sessions: clientLedger.sessions,
      appointmentId: clientLedger.appointmentId,
      clientPackageId: clientLedger.clientPackageId,
    })
    .from(clientLedger)
    .where(
      inArray(
        clientLedger.clientPackageId,
        pkgs.map((p) => p.id),
      ),
    );
  return pkgs.map((p) => ({
    ...p,
    left: packageSessionsLeft(moves, p.id),
    expired: p.expiresOn !== null && p.expiresOn < today,
  }));
}

export type { PickedSession } from "./session-use";

/** Pacote valendo da cliente para um dos serviços no dia (regra em `session-use.chooseSession`). */
export async function pickSession(
  tx: Tx,
  clientId: string,
  serviceIds: string[],
  today: string,
): Promise<PickedSession | null> {
  return chooseSession(await clientPackageList(tx, clientId, today), serviceIds, today);
}

/**
 * Sessão de pacote do atendimento, em SQL (para listas e mensagens sem buscar o extrato): nome do pacote, total,
 * qual sessão é esta (contando, em ordem de horário, os atendimentos que seguram sessão desse pacote), quantas
 * restam hoje e se este atendimento segura a sessão (cancelado devolve). Ler com `parseSessionUse`.
 */
export function sessionUseSql(id: SQL | Column, pkg: SQL | Column, startsAt: SQL | Column) {
  const net = (appt: SQL | Column) => sql`(select coalesce(sum(case when l.kind = 'session_reserve' then l.sessions
      when l.kind = 'session_return' then -l.sessions else 0 end), 0)
    from client_ledger l where l.appointment_id = ${appt} and l.client_package_id = cp.id)`;
  return sql<unknown>`case when ${pkg} is null then null else (
    select json_build_object(
      'name', cp.name,
      'total', cp.sessions_total,
      'held', ${net(id)} > 0,
      'n', (select count(*) from appointments a2 where a2.client_package_id = cp.id
              and (a2.starts_at < ${startsAt} or (a2.starts_at = ${startsAt} and a2.id <= ${id}))
              and ${net(sql`a2.id`)} > 0),
      'left', (select coalesce(sum(case when l.kind in ('session_grant', 'session_return') then l.sessions
                 when l.kind in ('session_reserve', 'expire') then -l.sessions else 0 end), 0)
               from client_ledger l where l.client_package_id = cp.id))
    from client_packages cp where cp.id = ${pkg}) end`;
}

/** Grava a sessão usada no atendimento: conta como pago nele e vira Ganho ao concluir. */
export const reserveSession = (
  tx: Tx,
  input: { tenantId: string; clientId: string; appointmentId: string; pick: PickedSession; createdBy?: string | null },
) =>
  tx.insert(clientLedger).values({
    tenantId: input.tenantId,
    clientId: input.clientId,
    appointmentId: input.appointmentId,
    clientPackageId: input.pick.clientPackageId,
    kind: "session_reserve",
    amountCents: input.pick.valueCents,
    sessions: 1,
    reason: `Sessão do pacote ${input.pick.name}`,
    createdBy: input.createdBy ?? null,
  });

export type SoldPackageRow = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  sessionsTotal: number;
  soldOn: string;
  expiresOn: string | null;
  /** sessões que restam (mesma conta de `rules.packageSessionsLeft`) */
  left: number;
  /** próximo horário marcado com sessão deste pacote (ISO), se houver */
  nextAt: Date | null;
};

/**
 * Todos os pacotes vendidos, com a cliente, as sessões que restam e o próximo horário marcado (página Planos).
 * Uma consulta só; a divisão em "Usando", "Acabou" e "Venceu" é de `plan-views.groupSold`.
 */
export async function listSoldPackages(tx: Tx): Promise<SoldPackageRow[]> {
  const rows = await tx.execute<{
    id: string;
    client_id: string;
    client_name: string;
    name: string;
    sessions_total: number;
    sold_on: string;
    expires_on: string | null;
    left: number;
    next_at: Date | string | null;
  }>(sql`
    select cp.id, cp.client_id, c.name as client_name, cp.name, cp.sessions_total, cp.sold_on::text as sold_on,
      cp.expires_on::text as expires_on,
      (select coalesce(sum(case when l.kind in ('session_grant', 'session_return') then l.sessions
                 when l.kind in ('session_reserve', 'expire') then -l.sessions else 0 end), 0)
        from client_ledger l where l.client_package_id = cp.id)::int as left,
      (select min(a.starts_at) from appointments a
        where a.client_package_id = cp.id and a.starts_at > now()
          and a.status in ('pending_confirmation', 'confirmed', 'reschedule_requested')) as next_at
    from client_packages cp join clients c on c.id = cp.client_id
    order by cp.expires_on nulls last, cp.created_at`);
  return rows.map((r) => ({
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    name: r.name,
    sessionsTotal: Number(r.sessions_total),
    soldOn: r.sold_on,
    expiresOn: r.expires_on,
    left: Number(r.left),
    nextAt: r.next_at ? new Date(r.next_at) : null,
  }));
}
