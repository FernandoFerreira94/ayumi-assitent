import { and, asc, eq, gt, inArray, isNull, lt, ne, sql } from "drizzle-orm";
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

export const listBlocks = (tx: Tx, [from, to]: [Date, Date]) =>
  tx
    .select()
    .from(blocks)
    .where(and(lt(blocks.startsAt, to), gt(blocks.endsAt, from), isNull(blocks.convertedAt)))
    .orderBy(asc(blocks.startsAt));

/** Há algum bloqueio cruzando [startsAt, endsAt)? */
export async function overlapsBlock(tx: Tx, startsAt: Date, endsAt: Date) {
  const r = await tx
    .select({ id: blocks.id })
    .from(blocks)
    .where(and(lt(blocks.startsAt, endsAt), gt(blocks.endsAt, startsAt), isNull(blocks.convertedAt)))
    .limit(1);
  return r.length > 0;
}
