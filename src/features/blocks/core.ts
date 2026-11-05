import { and, asc, eq, gt, lt, ne, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, blocks } from "@/db/schema";
import { toInstant } from "@/lib/dates";
import { fail, ok, type ActionResult } from "@/lib/errors";
import type { BlockInput } from "./schema";

/** Serializa criação de agendamentos/bloqueios do mesmo estúdio (evita corrida entre as duas tabelas). */
export const lockTenant = (tx: Tx, tenantId: string) =>
  tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);

export async function insertBlock(tx: Tx, tenantId: string, input: BlockInput): Promise<ActionResult<{ id: string }>> {
  const startsAt = toInstant(input.date, input.start);
  const endsAt = toInstant(input.date, input.end);
  await lockTenant(tx, tenantId);
  const clash = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(ne(appointments.status, "cancelled"), lt(appointments.startsAt, endsAt), gt(appointments.endsAt, startsAt)),
    )
    .limit(1);
  if (clash.length) return fail("HAS_APPOINTMENTS");
  const [row] = await tx
    .insert(blocks)
    .values({ tenantId, startsAt, endsAt, reason: input.reason })
    .returning({ id: blocks.id });
  return ok({ id: row.id });
}

export async function removeBlock(tx: Tx, id: string): Promise<ActionResult> {
  const rows = await tx.delete(blocks).where(eq(blocks.id, id)).returning({ id: blocks.id });
  return rows.length ? ok() : fail("NOT_ALLOWED");
}

export const listBlocks = (tx: Tx, [from, to]: [Date, Date]) =>
  tx
    .select()
    .from(blocks)
    .where(and(lt(blocks.startsAt, to), gt(blocks.endsAt, from)))
    .orderBy(asc(blocks.startsAt));

/** Há algum bloqueio cruzando [startsAt, endsAt)? */
export async function overlapsBlock(tx: Tx, startsAt: Date, endsAt: Date) {
  const r = await tx
    .select({ id: blocks.id })
    .from(blocks)
    .where(and(lt(blocks.startsAt, endsAt), gt(blocks.endsAt, startsAt)))
    .limit(1);
  return r.length > 0;
}
