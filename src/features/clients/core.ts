import { and, asc, count, desc, eq, gte, ilike, inArray, lt, ne, or, sum } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clients, services } from "@/db/schema";
import { serviceLabel } from "@/features/appointments/core";
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

/** Resumo do cartão da cliente: próximo horário, última visita, quantas vezes veio, quanto gastou e faltas. */
export async function clientSummary(tx: Tx, clientId: string, now = new Date()) {
  const label = (where: ReturnType<typeof and>, order: "asc" | "desc") =>
    tx
      .select({ startsAt: appointments.startsAt, service: serviceLabel })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(where)
      .orderBy(order === "asc" ? asc(appointments.startsAt) : desc(appointments.startsAt))
      .limit(1);
  const mine = eq(appointments.clientId, clientId);
  const [[next], [last], [totals], [faltas]] = await Promise.all([
    label(and(mine, gte(appointments.startsAt, now), ne(appointments.status, "cancelled")), "asc"),
    label(and(mine, lt(appointments.startsAt, now), eq(appointments.status, "done")), "desc"),
    tx
      .select({ visits: count(), spent: sum(appointments.priceCents) })
      .from(appointments)
      .where(and(mine, eq(appointments.status, "done"))),
    tx
      .select({ n: count() })
      .from(appointments)
      .where(and(mine, inArray(appointments.status, ["no_show"]))),
  ]);
  return {
    next: next ?? null,
    last: last ?? null,
    visits: totals?.visits ?? 0,
    spentCents: Number(totals?.spent ?? 0),
    noShows: faltas?.n ?? 0,
  };
}
