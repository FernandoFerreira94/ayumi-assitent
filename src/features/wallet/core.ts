import { and, asc, eq, inArray, isNull, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Tx } from "@/db/client";
import { clientLedger, tenants } from "@/db/schema";
import type { PaymentMethod } from "@/features/appointments/payment";
import type { Move, WalletPolicy } from "./rules";

/**
 * Carteira da cliente: leitura e gravação do extrato (`client_ledger`). Só insere; corrigir = anular.
 * Sempre dentro de `withTenant` (RLS) e, quando mexe em saldo, dentro do `lockTenant` de quem chama.
 */

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
    createdBy: input.createdBy ?? null,
    occurredAt: input.occurredAt ?? new Date(),
  });
}

/**
 * Anula os pagamentos ainda valendo de um atendimento (desmarcar "pago" ou trocar a forma). Cada um ganha uma
 * linha negativa apontando para ele; nada é apagado.
 */
export async function reverseAppointmentPayments(tx: Tx, appointmentId: string, createdBy?: string | null) {
  const rev = alias(clientLedger, "rev");
  const live = await tx
    .select()
    .from(clientLedger)
    .where(
      and(
        eq(clientLedger.appointmentId, appointmentId),
        eq(clientLedger.kind, "payment"),
        isNull(clientLedger.reversesId),
        notExists(tx.select({ id: rev.id }).from(rev).where(eq(rev.reversesId, clientLedger.id))),
      ),
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
      reason: "Pagamento desmarcado",
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
