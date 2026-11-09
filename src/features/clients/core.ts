import { and, asc, eq, ilike, or } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import type { ClientInput } from "./schema";

export async function insertClient(
  tx: Tx,
  tenantId: string,
  input: ClientInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // savepoint: um erro aqui não invalida a transação inteira
    const row = await tx.transaction(async (sp) => {
      const [r] = await sp
        .insert(clients)
        .values({ tenantId, name: input.name, phoneE164: input.phone, email: input.email, notes: input.notes })
        .returning({ id: clients.id });
      return r;
    });
    return ok({ id: row.id });
  } catch (e) {
    // 23505 = telefone já cadastrado neste estúdio
    const code = (e as { cause?: { code?: string }; code?: string }).cause?.code ?? (e as { code?: string }).code;
    if (code === "23505") return fail("PHONE_EXISTS", "phone");
    throw e;
  }
}

export async function searchClients(tx: Tx, q: string) {
  const term = q.trim().replace(/[%_\\]/g, "\\$&");
  const digits = q.replace(/\D/g, "");
  const filter = term
    ? or(ilike(clients.name, `%${term}%`), digits ? ilike(clients.phoneE164, `%${digits}%`) : undefined)
    : undefined;
  return tx.select().from(clients).where(and(filter)).orderBy(asc(clients.name)).limit(200);
}

export async function updateClientRow(tx: Tx, id: string, input: ClientInput): Promise<ActionResult> {
  try {
    const rows = await tx.transaction(async (sp) =>
      sp
        .update(clients)
        .set({ name: input.name, phoneE164: input.phone, email: input.email ?? null })
        .where(eq(clients.id, id))
        .returning({ id: clients.id }),
    );
    return rows.length ? ok() : fail("UNKNOWN");
  } catch (e) {
    const code = (e as { cause?: { code?: string }; code?: string }).cause?.code ?? (e as { code?: string }).code;
    if (code === "23505") return fail("PHONE_EXISTS", "phone");
    throw e;
  }
}

/** Não apaga quem tem agendamentos: o histórico da agenda ficaria sem cliente. */
export async function deleteClientRow(tx: Tx, id: string): Promise<ActionResult> {
  const [used] = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.clientId, id))
    .limit(1);
  if (used) return fail("CLIENT_HAS_APPOINTMENTS");
  await tx.delete(clients).where(eq(clients.id, id));
  return ok();
}
