import { and, asc, eq, gt, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, blocks } from "@/db/schema";
import { toInstant } from "@/lib/dates";
import { fail, ok, type ActionResult } from "@/lib/errors";
import type { BlockInput } from "./schema";

/** Serializa criação de agendamentos/bloqueios do mesmo estúdio (evita corrida entre as duas tabelas). */
export const lockTenant = (tx: Tx, tenantId: string) =>
  tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);

/** Bloqueio que vale para a profissional: o dela ou o do salão todo (professional_id null). */
const blockFor = (professionalId: string) => or(isNull(blocks.professionalId), eq(blocks.professionalId, professionalId));

/**
 * `professionalId` null (padrão) = bloqueio do salão todo (ex.: feriado): confere os atendimentos de todas.
 * Com profissional, vale só para a agenda dela.
 */
export async function insertBlock(
  tx: Tx,
  tenantId: string,
  input: BlockInput,
  professionalId: string | null = null,
): Promise<ActionResult<{ id: string }>> {
  const startsAt = toInstant(input.date, input.start);
  const endsAt = toInstant(input.date, input.end);
  await lockTenant(tx, tenantId);
  const clash = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        ne(appointments.status, "cancelled"),
        lt(appointments.startsAt, endsAt),
        gt(appointments.endsAt, startsAt),
        professionalId ? eq(appointments.professionalId, professionalId) : undefined,
      ),
    )
    .limit(1);
  if (clash.length) return fail("HAS_APPOINTMENTS");
  const [row] = await tx
    .insert(blocks)
    .values({ tenantId, professionalId, startsAt, endsAt, reason: input.reason })
    .returning({ id: blocks.id });
  return ok({ id: row.id });
}

export async function removeBlock(tx: Tx, id: string): Promise<ActionResult> {
  // evento importado do Google é somente leitura: some ao apagar no Google
  const rows = await tx
    .delete(blocks)
    .where(and(eq(blocks.id, id), eq(blocks.source, "app")))
    .returning({ id: blocks.id });
  return rows.length ? ok() : fail("NOT_ALLOWED");
}

/** Evento de fora (iPhone/Google) virou atendimento: some da agenda e deixa de ocupar o horário. */
export async function convertExternalBlock(tx: Tx, id: string): Promise<boolean> {
  const rows = await tx
    .update(blocks)
    .set({ convertedAt: new Date() })
    .where(and(eq(blocks.id, id), inArray(blocks.source, ["google", "icloud"]), isNull(blocks.convertedAt)))
    .returning({ id: blocks.id });
  return rows.length > 0;
}

/** Bloqueios do período; com `professionalId`, só os dela e os do salão todo. */
export const listBlocks = (tx: Tx, [from, to]: [Date, Date], professionalId?: string) =>
  tx
    .select()
    .from(blocks)
    .where(
      and(
        lt(blocks.startsAt, to),
        gt(blocks.endsAt, from),
        isNull(blocks.convertedAt),
        professionalId ? blockFor(professionalId) : undefined,
      ),
    )
    .orderBy(asc(blocks.startsAt));

/** Há algum bloqueio (da profissional ou do salão todo) cruzando [startsAt, endsAt)? */
export async function overlapsBlock(tx: Tx, professionalId: string, startsAt: Date, endsAt: Date) {
  const r = await tx
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      and(lt(blocks.startsAt, endsAt), gt(blocks.endsAt, startsAt), isNull(blocks.convertedAt), blockFor(professionalId)),
    )
    .limit(1);
  return r.length > 0;
}
