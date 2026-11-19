import { and, asc, eq, inArray } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { clientLedger, clientPackages, packageTemplates, services } from "@/db/schema";
import type { PaymentMethod } from "@/features/appointments/payment";
import { getWalletSettings } from "./core";
import { packageExpiresOn, packagePrice, packageSessionsLeft, sessionValue, type PackageDraft } from "./rules";

/**
 * Pacotes (carteira, PR 4): modelos do salão, venda para a cliente e sessões no extrato.
 * Sempre dentro de `withTenant` (RLS); vender e reservar sessão dentro do `lockTenant` de quem chama.
 */

export type TemplateRow = {
  id: string;
  kind: "pay_x" | "sessions";
  name: string;
  serviceId: string;
  serviceName: string;
  servicePriceCents: number;
  sessionsPaid: number | null;
  sessionsTotal: number;
  priceCents: number;
  validDays: number | null;
};

/** Modelos ativos, com o serviço (nome e preço de hoje). */
export function listTemplates(tx: Tx): Promise<TemplateRow[]> {
  return tx
    .select({
      id: packageTemplates.id,
      kind: packageTemplates.kind,
      name: packageTemplates.name,
      serviceId: packageTemplates.serviceId,
      serviceName: services.name,
      servicePriceCents: services.priceCents,
      sessionsPaid: packageTemplates.sessionsPaid,
      sessionsTotal: packageTemplates.sessionsTotal,
      priceCents: packageTemplates.priceCents,
      validDays: packageTemplates.validDays,
    })
    .from(packageTemplates)
    .innerJoin(services, eq(services.id, packageTemplates.serviceId))
    .where(eq(packageTemplates.active, true))
    .orderBy(asc(packageTemplates.createdAt));
}

/** Cria o modelo. "Pague X, leve Y" grava o preço de hoje (X × serviço); a venda recalcula. */
export async function createTemplate(tx: Tx, tenantId: string, d: PackageDraft): Promise<string | null> {
  const [svc] = await tx
    .select({ priceCents: services.priceCents })
    .from(services)
    .where(and(eq(services.id, d.serviceId), eq(services.active, true)));
  if (!svc) return null;
  const [row] = await tx
    .insert(packageTemplates)
    .values({
      tenantId,
      kind: d.kind,
      name: d.name,
      serviceId: d.serviceId,
      sessionsPaid: d.sessionsPaid,
      sessionsTotal: d.sessionsTotal,
      priceCents: packagePrice(d, svc.priceCents),
    })
    .returning({ id: packageTemplates.id });
  return row?.id ?? null;
}

/** Tira o modelo da lista de venda (os pacotes já vendidos continuam valendo). */
export const archiveTemplate = (tx: Tx, id: string) =>
  tx.update(packageTemplates).set({ active: false }).where(eq(packageTemplates.id, id));

/**
 * Vende um pacote para a cliente: copia o modelo, dá as sessões e grava o pagamento (entra no caixa do dia,
 * não nos Ganhos nem no crédito). Validade: a do modelo ou a padrão de Ajustes > Pagamentos.
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
): Promise<{ id: string; priceCents: number; sessions: number; expiresOn: string } | null> {
  const [t] = await tx
    .select({
      kind: packageTemplates.kind,
      name: packageTemplates.name,
      serviceId: packageTemplates.serviceId,
      sessionsPaid: packageTemplates.sessionsPaid,
      sessionsTotal: packageTemplates.sessionsTotal,
      priceCents: packageTemplates.priceCents,
      validDays: packageTemplates.validDays,
      servicePriceCents: services.priceCents,
    })
    .from(packageTemplates)
    .innerJoin(services, eq(services.id, packageTemplates.serviceId))
    .where(and(eq(packageTemplates.id, input.templateId), eq(packageTemplates.active, true)));
  if (!t) return null;
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
  return { id: p!.id, priceCents: price, sessions: t.sessionsTotal, expiresOn };
}

export type ClientPackage = {
  id: string;
  name: string;
  serviceId: string;
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

export type PickedSession = {
  clientPackageId: string;
  name: string;
  serviceId: string;
  valueCents: number;
  /** sessões que restam depois desta */
  left: number;
  total: number;
};

/**
 * Pacote valendo da cliente para um dos serviços (o que vence primeiro) e o valor da próxima sessão
 * (preço ÷ sessões; a sobra dos centavos vai na última). null = sem pacote para usar.
 */
export async function pickSession(
  tx: Tx,
  clientId: string,
  serviceIds: string[],
  today: string,
): Promise<PickedSession | null> {
  const pkg = (await clientPackageList(tx, clientId, today)).find(
    (p) => !p.expired && p.left > 0 && serviceIds.includes(p.serviceId),
  );
  if (!pkg) return null;
  const used = pkg.sessionsTotal - pkg.left;
  return {
    clientPackageId: pkg.id,
    name: pkg.name,
    serviceId: pkg.serviceId,
    valueCents: sessionValue(pkg.priceCents, pkg.sessionsTotal, Math.min(used, pkg.sessionsTotal - 1)),
    left: pkg.left - 1,
    total: pkg.sessionsTotal,
  };
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

/** Modelo vendável para a tela de venda. */
export async function templateById(tx: Tx, id: string) {
  const [t] = (await listTemplates(tx)).filter((x) => x.id === id);
  return t ?? null;
}
