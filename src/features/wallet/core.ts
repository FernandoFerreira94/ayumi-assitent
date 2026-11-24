import { and, asc, eq, gte, inArray, isNull, lt, notExists, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Tx } from "@/db/client";
import { appointments, clientLedger, tenants } from "@/db/schema";
import type { PaymentMethod } from "@/features/appointments/payment";
import {
  appointmentPaid,
  cancelOutcome,
  walletBalance,
  type LedgerKind,
  type Move,
  type Outcome,
  type WalletPolicy,
} from "./rules";

/**
 * Carteira da cliente: leitura e gravação do extrato (`client_ledger`). Só insere; corrigir = anular.
 * Sempre dentro de `withTenant` (RLS) e, quando mexe em saldo, dentro do `lockTenant` de quem chama.
 */

/** Motivo do pagamento que o app grava sozinho ao concluir (o que faltava). Sair de concluído anula só esses. */
export const AUTO_DONE_REASON = "Recebido ao concluir";

/**
 * Quanto do atendimento já está pago, em SQL (mesma regra de `rules.appointmentPaid`), para as listas da agenda
 * e do Financeiro sem buscar o extrato inteiro. `paidCentsOf` serve ao SQL cru (claims do worker).
 */
export const paidCentsOf = (id: SQL) => sql`coalesce((
  select sum(case when l.kind in ('payment', 'credit_use', 'session_reserve') then l.amount_cents
                  when l.kind in ('refund', 'credit_in', 'retained', 'session_return') then -l.amount_cents else 0 end)
  from client_ledger l where l.appointment_id = ${id}
), 0)`;

export const paidCentsSql = sql<number>`${paidCentsOf(sql`${appointments.id}`)}`.mapWith(Number);

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
      clientPackageId: clientLedger.clientPackageId,
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

/** Movimentos ainda valendo (não anulados) de um atendimento, dos tipos pedidos; `only` filtra mais. */
async function liveMoves(tx: Tx, appointmentId: string, kinds: LedgerKind[], only?: SQL) {
  const rev = alias(clientLedger, "rev");
  return tx
    .select()
    .from(clientLedger)
    .where(
      and(
        eq(clientLedger.appointmentId, appointmentId),
        inArray(clientLedger.kind, kinds),
        isNull(clientLedger.reversesId),
        notExists(tx.select({ id: rev.id }).from(rev).where(eq(rev.reversesId, clientLedger.id))),
        only,
      ),
    );
}

const livePayments = (tx: Tx, appointmentId: string, only?: SQL) => liveMoves(tx, appointmentId, ["payment"], only);

/** Anula movimentos: cada um ganha uma linha negativa apontando para ele; nada é apagado. */
async function reverseMoves(
  tx: Tx,
  rows: Awaited<ReturnType<typeof liveMoves>>,
  reason: string,
  createdBy?: string | null,
) {
  if (!rows.length) return;
  await tx.insert(clientLedger).values(
    rows.map((m) => ({
      tenantId: m.tenantId,
      clientId: m.clientId,
      appointmentId: m.appointmentId,
      clientPackageId: m.clientPackageId,
      kind: m.kind,
      amountCents: -m.amountCents,
      sessions: -m.sessions,
      method: m.method,
      reason,
      reversesId: m.id,
      createdBy: createdBy ?? null,
    })),
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
  await reverseMoves(tx, live, opts.reason ?? "Pagamento desmarcado", createdBy);
}

/** Quanto do atendimento está pago agora (pagamentos e crédito usado, menos o que saiu dele). */
export async function appointmentPaidCents(tx: Tx, appointmentId: string) {
  return appointmentPaid(await appointmentMoves(tx, [appointmentId]), appointmentId);
}

/** Crédito da cliente agora (soma do extrato). */
export async function clientBalance(tx: Tx, clientId: string) {
  return walletBalance(await clientMoves(tx, clientId));
}

/** Usa o crédito da cliente num atendimento (no máximo `upTo`). Devolve quanto usou. */
export async function useCredit(
  tx: Tx,
  input: { tenantId: string; clientId: string; appointmentId: string; upTo: number; createdBy?: string | null },
) {
  const amount = Math.min(input.upTo, await clientBalance(tx, input.clientId));
  if (amount <= 0) return 0;
  await tx.insert(clientLedger).values({
    tenantId: input.tenantId,
    clientId: input.clientId,
    appointmentId: input.appointmentId,
    kind: "credit_use",
    amountCents: amount,
    reason: "Crédito usado no agendamento",
    createdBy: input.createdBy ?? null,
  });
  return amount;
}

const CLOSED = new Set(["cancelled", "no_show"]);

/**
 * Carteira quando o status muda (D1/D2). Cancelar ou faltar: o que foi pago vira crédito da cliente, menos o
 * sinal que fica para o salão quando a política manda (Ajustes > Pagamentos). Sair de cancelado/faltou anula
 * esse acerto, e o pago volta para o atendimento. Devolve o acerto feito (null quando nada mudou de lugar).
 */
export async function settleStatusChange(
  tx: Tx,
  a: { id: string; tenantId: string; clientId: string; startsAt: Date; priceCents: number },
  prev: string,
  next: string,
  now: Date = new Date(),
  createdBy?: string | null,
): Promise<Outcome | null> {
  if (prev === next) return null;
  if (CLOSED.has(prev))
    await reverseMoves(
      tx,
      await liveMoves(tx, a.id, ["credit_in", "retained", "session_return"]),
      "Voltou para a agenda",
      createdBy,
    );
  if (!CLOSED.has(next)) return null;
  const policy = await getWalletSettings(tx);
  // Sessão de pacote: volta para o pacote ao cancelar; na falta, depende da política. Não vira dinheiro.
  const reserves = await liveMoves(tx, a.id, ["session_reserve"]);
  const pkgValue = reserves.reduce((t, m) => t + m.amountCents, 0);
  const paid = (await appointmentPaidCents(tx, a.id)) - pkgValue;
  const sessionBack = reserves.length > 0 && (next === "cancelled" || !policy.noShowUsesSession);
  if (sessionBack)
    await tx.insert(clientLedger).values(
      reserves.map((m) => ({
        tenantId: m.tenantId,
        clientId: m.clientId,
        appointmentId: m.appointmentId,
        clientPackageId: m.clientPackageId,
        kind: "session_return" as const,
        amountCents: m.amountCents,
        sessions: m.sessions,
        reason: next === "no_show" ? "Faltou: sessão devolvida" : "Cancelou: sessão devolvida",
        createdBy: createdBy ?? null,
      })),
    );
  if (paid <= 0) return reserves.length ? { toCredit: 0, retained: 0, sessionBack, late: false } : null;
  const out = cancelOutcome({
    policy,
    status: next as "cancelled" | "no_show",
    startsAt: a.startsAt,
    at: now,
    totalCents: Math.max(0, a.priceCents - pkgValue),
    paidCents: paid,
  });
  const base = { tenantId: a.tenantId, clientId: a.clientId, appointmentId: a.id, createdBy: createdBy ?? null };
  const rows = [
    {
      ...base,
      kind: "credit_in" as const,
      amountCents: out.toCredit,
      reason: next === "no_show" ? "Faltou" : "Cancelou",
    },
    {
      ...base,
      kind: "retained" as const,
      amountCents: out.retained,
      reason: next === "no_show" ? "Sinal da falta" : "Sinal do cancelamento em cima da hora",
    },
  ].filter((r) => r.amountCents > 0);
  if (rows.length) await tx.insert(clientLedger).values(rows);
  return { ...out, sessionBack };
}

/** Devolve dinheiro do crédito da cliente (estorno manual). No máximo o crédito que ela tem. */
export async function refundCredit(
  tx: Tx,
  input: {
    tenantId: string;
    clientId: string;
    amountCents: number;
    method: PaymentMethod | null;
    reason?: string | null;
    createdBy?: string | null;
  },
): Promise<"ok" | "too_much"> {
  if (input.amountCents <= 0 || input.amountCents > (await clientBalance(tx, input.clientId))) return "too_much";
  await tx.insert(clientLedger).values({
    tenantId: input.tenantId,
    clientId: input.clientId,
    appointmentId: null,
    kind: "refund",
    amountCents: input.amountCents,
    method: input.method,
    reason: input.reason || "Devolvido à cliente",
    createdBy: input.createdBy ?? null,
  });
  return "ok";
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
