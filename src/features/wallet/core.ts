import { and, asc, eq, gte, inArray, isNull, lt, notExists, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Tx } from "@/db/client";
import { appointments, clientLedger, tenants } from "@/db/schema";
import type { PaymentMethod } from "@/features/appointments/payment";
import type { Move, WalletPolicy } from "./rules";

/**
 * Carteira da cliente: leitura e gravação do extrato (`client_ledger`). Só insere; corrigir = anular.
 * Sempre dentro de `withTenant` (RLS) e, quando mexe em saldo, dentro do `lockTenant` de quem chama.
 */

/** Motivo do pagamento que o app grava sozinho ao concluir (o que faltava). Sair de concluído anula só esses. */
export const AUTO_DONE_REASON = "Recebido ao concluir";

/**
 * Quanto do atendimento já está pago, em SQL (mesma regra de `rules.appointmentPaid`), para as listas da agenda
 * e do Financeiro sem buscar o extrato inteiro.
 */
export const paidCentsSql = sql<number>`coalesce((
  select sum(case when l.kind in ('payment', 'credit_use') then l.amount_cents
                  when l.kind in ('refund', 'credit_in', 'retained') then -l.amount_cents else 0 end)
  from client_ledger l where l.appointment_id = ${appointments.id}
), 0)`.mapWith(Number);

/** Dinheiro que entrou no caixa no período (pagamentos menos devoluções), pela data do movimento. */
export async function cashInRange(tx: Tx, [from, to]: [Date, Date]): Promise<number> {
  const [r] = await tx
    .select({
      cents: sql<number>`coalesce(sum(case when ${clientLedger.kind} = 'payment' then ${clientLedger.amountCents}
        when ${clientLedger.kind} = 'refund' then -${clientLedger.amountCents} else 0 end), 0)`.mapWith(Number),
    })
    .from(clientLedger)
    .where(and(gte(clientLedger.occurredAt, from), lt(clientLedger.occurredAt, to)));
  return r?.cents ?? 0;
}

/** Movimentos da cliente, do mais velho ao mais novo. */
export function clientMoves(tx: Tx, clientId: string) {
  return tx
    .select({
      id: clientLedger.id,
      kind: clientLedger.kind,
      amountCents: clientLedger.amountCents,
      sessions: clientLedger.sessions,
      appointmentId: clientLedger.appointmentId,
      method: clientLedger.method,
      reason: clientLedger.reason,
      reversesId: clientLedger.reversesId,
      occurredAt: clientLedger.occurredAt,
    })
    .from(clientLedger)
    .where(eq(clientLedger.clientId, clientId))
    .orderBy(asc(clientLedger.occurredAt), asc(clientLedger.createdAt));
}

/** Movimentos de dinheiro de um ou mais atendimentos (para "pago R$ X de R$ Y"). */
export function appointmentMoves(tx: Tx, appointmentIds: string[]): Promise<Move[]> {
  if (!appointmentIds.length) return Promise.resolve([]);
  return tx
    .select({
      kind: clientLedger.kind,
      amountCents: clientLedger.amountCents,
      appointmentId: clientLedger.appointmentId,
    })
    .from(clientLedger)
    .where(inArray(clientLedger.appointmentId, appointmentIds));
}

/** Pagamentos ainda valendo (não anulados) de um atendimento; `only` filtra por motivo. */
async function livePayments(tx: Tx, appointmentId: string, only?: SQL) {
  const rev = alias(clientLedger, "rev");
  return tx
    .select()
    .from(clientLedger)
    .where(
      and(
        eq(clientLedger.appointmentId, appointmentId),
        eq(clientLedger.kind, "payment"),
        isNull(clientLedger.reversesId),
        notExists(tx.select({ id: rev.id }).from(rev).where(eq(rev.reversesId, clientLedger.id))),
        only,
      ),
    );
}

/** Soma dos pagamentos valendo do atendimento. */
export async function livePaidCents(tx: Tx, appointmentId: string) {
  return (await livePayments(tx, appointmentId)).reduce((t, m) => t + m.amountCents, 0);
}

/** Grava um pagamento da cliente (com atendimento = pago nele; sem = entra no crédito). */
export async function recordPayment(
  tx: Tx,
  input: {
    tenantId: string;
    clientId: string;
    appointmentId: string | null;
    amountCents: number;
    method: PaymentMethod | null;
    createdBy?: string | null;
    occurredAt?: Date;
    reason?: string | null;
  },
) {
  if (input.amountCents <= 0) return;
  await tx.insert(clientLedger).values({
    tenantId: input.tenantId,
    clientId: input.clientId,
    appointmentId: input.appointmentId,
    kind: "payment",
    amountCents: input.amountCents,
    method: input.method,
    reason: input.reason ?? null,
    createdBy: input.createdBy ?? null,
    occurredAt: input.occurredAt ?? new Date(),
  });
}

/**
 * Anula os pagamentos ainda valendo de um atendimento (desmarcar "pago", trocar sinal/forma, sair de concluído).
 * Cada um ganha uma linha negativa apontando para ele; nada é apagado. `onlyAuto` anula só o "Recebido ao concluir".
 */
export async function reverseAppointmentPayments(
  tx: Tx,
  appointmentId: string,
  createdBy?: string | null,
  opts: { onlyAuto?: boolean; reason?: string } = {},
) {
  const live = await livePayments(
    tx,
    appointmentId,
    opts.onlyAuto ? eq(clientLedger.reason, AUTO_DONE_REASON) : undefined,
  );
  if (!live.length) return;
  await tx.insert(clientLedger).values(
    live.map((m) => ({
      tenantId: m.tenantId,
      clientId: m.clientId,
      appointmentId: m.appointmentId,
      kind: m.kind,
      amountCents: -m.amountCents,
      sessions: -m.sessions,
      method: m.method,
      reason: opts.reason ?? "Pagamento desmarcado",
      reversesId: m.id,
      createdBy: createdBy ?? null,
    })),
  );
}

export type WalletSettings = WalletPolicy & { pixKey: string | null };

/** Política do salão (Ajustes > Pagamentos). */
export async function getWalletSettings(tx: Tx): Promise<WalletSettings> {
  const [t] = await tx
    .select({
      depositPct: tenants.depositPct,
      cancelNoticeHours: tenants.cancelNoticeHours,
      lateCancelKeepsDeposit: tenants.lateCancelKeepsDeposit,
      noShowKeepsDeposit: tenants.noShowKeepsDeposit,
      noShowUsesSession: tenants.noShowUsesSession,
      packageValidDays: tenants.packageValidDays,
      pixKey: tenants.pixKey,
    })
    .from(tenants);
  if (!t) throw new Error("estúdio não encontrado");
  return t;
}

export const saveWalletSettings = (tx: Tx, tenantId: string, s: WalletSettings) =>
  tx
    .update(tenants)
    .set({
      depositPct: s.depositPct,
      cancelNoticeHours: s.cancelNoticeHours,
      lateCancelKeepsDeposit: s.lateCancelKeepsDeposit,
      noShowKeepsDeposit: s.noShowKeepsDeposit,
      noShowUsesSession: s.noShowUsesSession,
      packageValidDays: s.packageValidDays,
      pixKey: s.pixKey,
    })
    .where(eq(tenants.id, tenantId));
