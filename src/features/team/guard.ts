import { eq, inArray } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, blocks, slotLists } from "@/db/schema";
import { canAs, type Actor } from "./permissions";

/**
 * Quem é a dona de cada registro vem do banco (dentro do withTenant), nunca do que o navegador mandou.
 * Id que não existe passa: o core responde "sem acesso" do jeito de sempre e nada vaza.
 */

/** Todos os atendimentos precisam ser da agenda de quem edita (dona e gerente: de qualquer uma). */
export async function mayEditAppointments(tx: Tx, actor: Actor, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const rows = await tx
    .select({ owner: appointments.professionalId })
    .from(appointments)
    .where(inArray(appointments.id, ids));
  return rows.every((r) => canAs(actor, "agenda.edit", r.owner));
}

/** Bloqueio sem profissional (null) vale para o salão todo: só dona e gerente. */
export async function mayEditBlock(tx: Tx, actor: Actor, id: string): Promise<boolean> {
  const rows = await tx.select({ owner: blocks.professionalId }).from(blocks).where(eq(blocks.id, id));
  return rows.every((r) => canAs(actor, "agenda.edit", r.owner));
}

export async function mayEditSlotList(tx: Tx, actor: Actor, id: string): Promise<boolean> {
  const rows = await tx.select({ owner: slotLists.professionalId }).from(slotLists).where(eq(slotLists.id, id));
  return rows.every((r) => canAs(actor, "agenda.edit", r.owner));
}
