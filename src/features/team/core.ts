import { and, asc, count, eq, gt, gte, inArray, isNull, max } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, professionals, teamInvites } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { hashInviteToken, inviteExpiresAt, newInviteToken } from "./invite";

/** Atendimentos que ainda ocupam a agenda (cancelado, feito e falta já são histórico). */
const OPEN_STATUSES = ["pending_confirmation", "confirmed", "reschedule_requested"] as const;

export type ProfessionalInput = { name: string; color?: string | null };

/**
 * PONTO DE LIGAÇÃO DO LIMITE DE ASSENTOS (task B7): criar ou reativar profissional passa por aqui.
 * Quando existir `entitlements.maxProfessionals` (com o trial permitindo o máximo do plano escolhido), a B7
 * conta as profissionais ativas do salão e devolve um erro de limite ao passar do máximo.
 * Até lá não há cobrança, então não há limite.
 */
export async function assertSeatAvailable(_tx: Tx, _tenantId: string): Promise<ActionResult> {
  return ok();
}

export async function listProfessionals(tx: Tx) {
  return tx
    .select({
      id: professionals.id,
      name: professionals.displayName,
      color: professionals.color,
      active: professionals.active,
      position: professionals.position,
    })
    .from(professionals)
    .orderBy(asc(professionals.position), asc(professionals.createdAt));
}

async function nameTaken(tx: Tx, name: string, exceptId?: string) {
  const rows = await tx.select({ id: professionals.id, name: professionals.displayName }).from(professionals);
  const wanted = name.trim().toLocaleLowerCase("pt-BR");
  return rows.some((r) => r.id !== exceptId && r.name.trim().toLocaleLowerCase("pt-BR") === wanted);
}

export async function createProfessional(
  tx: Tx,
  tenantId: string,
  input: ProfessionalInput,
): Promise<ActionResult<{ id: string }>> {
  const seat = await assertSeatAvailable(tx, tenantId);
  if (!seat.ok) return seat;
  if (await nameTaken(tx, input.name)) return fail("NAME_TAKEN", "name");
  const [top] = await tx.select({ top: max(professionals.position) }).from(professionals);
  const [row] = await tx
    .insert(professionals)
    .values({ tenantId, displayName: input.name.trim(), color: input.color ?? null, position: (top?.top ?? -1) + 1 })
    .returning({ id: professionals.id });
  return ok({ id: row!.id });
}

export async function updateProfessional(tx: Tx, id: string, input: ProfessionalInput): Promise<ActionResult> {
  if (await nameTaken(tx, input.name, id)) return fail("NAME_TAKEN", "name");
  const rows = await tx
    .update(professionals)
    .set({ displayName: input.name.trim(), color: input.color ?? null })
    .where(eq(professionals.id, id))
    .returning({ id: professionals.id });
  return rows.length ? ok() : fail("NOT_FOUND");
}

export async function activateProfessional(tx: Tx, tenantId: string, id: string): Promise<ActionResult> {
  const [p] = await tx.select({ active: professionals.active }).from(professionals).where(eq(professionals.id, id));
  if (!p) return fail("NOT_FOUND");
  if (p.active) return ok();
  const seat = await assertSeatAvailable(tx, tenantId);
  if (!seat.ok) return seat;
  await tx.update(professionals).set({ active: true }).where(eq(professionals.id, id));
  return ok();
}

const futureOpen = (professionalId: string, now: Date) =>
  and(
    eq(appointments.professionalId, professionalId),
    gte(appointments.startsAt, now),
    inArray(appointments.status, [...OPEN_STATUSES]),
  );

export async function countFutureAppointments(tx: Tx, professionalId: string, now: Date): Promise<number> {
  const [r] = await tx.select({ n: count() }).from(appointments).where(futureOpen(professionalId, now));
  return r?.n ?? 0;
}

export type DeactivatePlan = { kind: "none" } | { kind: "reassign"; toProfessionalId: string } | { kind: "cancel" };

function pgCode(e: unknown): string | undefined {
  const x = e as { code?: string; cause?: { code?: string } };
  return x.cause?.code ?? x.code;
}

/**
 * Desativa a profissional. Atendimentos futuros em aberto exigem um destino: passar para outra profissional
 * (ativa) ou cancelar. O histórico (feitos, cancelados, passados) fica como está. Devolve os ids mexidos para
 * quem chama avisar o Google.
 */
export async function deactivateProfessional(
  tx: Tx,
  id: string,
  plan: DeactivatePlan,
  now: Date,
): Promise<ActionResult<{ touched: string[] }>> {
  const [p] = await tx.select({ active: professionals.active }).from(professionals).where(eq(professionals.id, id));
  if (!p) return fail("NOT_FOUND");
  if (!p.active) return ok({ touched: [] });
  const [actives] = await tx.select({ n: count() }).from(professionals).where(eq(professionals.active, true));
  if ((actives?.n ?? 0) <= 1) return fail("LAST_PROFESSIONAL");

  const future = await tx.select({ id: appointments.id }).from(appointments).where(futureOpen(id, now));
  const ids = future.map((a) => a.id);
  if (ids.length > 0 && plan.kind === "none") return fail("HAS_FUTURE_APPOINTMENTS");

  if (ids.length > 0 && plan.kind === "reassign") {
    if (plan.toProfessionalId === id) return fail("VALIDATION", "toProfessionalId");
    const [target] = await tx
      .select({ active: professionals.active })
      .from(professionals)
      .where(eq(professionals.id, plan.toProfessionalId));
    if (!target?.active) return fail("VALIDATION", "toProfessionalId");
    try {
      // Savepoint: se o horário já estiver ocupado para a outra, nada muda e a transação segue viva
      await tx.transaction((sp) =>
        sp.update(appointments).set({ professionalId: plan.toProfessionalId }).where(inArray(appointments.id, ids)),
      );
    } catch (e) {
      if (pgCode(e) === "23P01") return fail("SLOT_TAKEN", "toProfessionalId");
      throw e;
    }
  } else if (ids.length > 0 && plan.kind === "cancel") {
    await tx.update(appointments).set({ status: "cancelled" }).where(inArray(appointments.id, ids));
  }
  await tx.update(professionals).set({ active: false }).where(eq(professionals.id, id));
  return ok({ touched: ids });
}

/* ───────────── convites ───────────── */

export type InviteTarget = { role: "professional"; professionalId: string } | { role: "admin" };

/**
 * Gera o convite. Devolve o token em claro uma única vez (só o hash vai para o banco). Para profissional, o
 * link anterior ainda não usado é apagado (o link novo substitui o velho). `professionalHasLogin` vem de quem
 * chama, porque a tabela de vínculos não é lida dentro do salão ativo.
 */
export async function createInvite(
  tx: Tx,
  tenantId: string,
  createdBy: string,
  target: InviteTarget,
  professionalHasLogin: boolean,
  now: Date,
): Promise<ActionResult<{ token: string; expiresAt: Date }>> {
  if (target.role === "professional") {
    const [p] = await tx
      .select({ active: professionals.active })
      .from(professionals)
      .where(eq(professionals.id, target.professionalId));
    if (!p?.active) return fail("NOT_FOUND");
    if (professionalHasLogin) return fail("PROFESSIONAL_HAS_LOGIN");
    await tx
      .delete(teamInvites)
      .where(and(eq(teamInvites.professionalId, target.professionalId), isNull(teamInvites.usedAt)));
  }
  const token = newInviteToken();
  const expiresAt = inviteExpiresAt(now);
  await tx.insert(teamInvites).values({
    tenantId,
    tokenHash: hashInviteToken(token),
    role: target.role,
    professionalId: target.role === "professional" ? target.professionalId : null,
    expiresAt,
    createdBy,
  });
  return ok({ token, expiresAt });
}

/** Convites ainda válidos (sem o token: ele só existe no momento em que é gerado). */
export async function listPendingInvites(tx: Tx, now: Date) {
  return tx
    .select({
      id: teamInvites.id,
      role: teamInvites.role,
      professionalId: teamInvites.professionalId,
      expiresAt: teamInvites.expiresAt,
    })
    .from(teamInvites)
    .where(and(isNull(teamInvites.usedAt), gt(teamInvites.expiresAt, now)))
    .orderBy(asc(teamInvites.createdAt));
}

export async function revokeInvite(tx: Tx, id: string): Promise<ActionResult> {
  const rows = await tx
    .delete(teamInvites)
    .where(and(eq(teamInvites.id, id), isNull(teamInvites.usedAt)))
    .returning({ id: teamInvites.id });
  return rows.length ? ok() : fail("NOT_FOUND");
}
