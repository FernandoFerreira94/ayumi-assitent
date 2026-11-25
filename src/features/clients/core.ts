import { and, asc, between, count, desc, eq, gte, ilike, inArray, isNull, lt, ne, or, sql, sum } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, clientLedger, clients, messages, services, unclearReplies } from "@/db/schema";
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
  // Anonimizadas (excluídas com histórico) não aparecem em listas nem seletores
  return (
    tx
      .select()
      .from(clients)
      .where(and(isNull(clients.anonymizedAt), filter))
      // Sem limite: a lista, os filtros e os seletores precisam de todas (o salão tem centenas, não milhões)
      .orderBy(asc(clients.name))
  );
}

/** Total de clientes do salão (RLS isola por salão), sem as anonimizadas: um `count`, sem carregar a lista. */
export async function countClients(tx: Tx): Promise<number> {
  const [r] = await tx.select({ n: count() }).from(clients).where(isNull(clients.anonymizedAt));
  return r?.n ?? 0;
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

/** Telefone guardado no lugar do real ao anonimizar: único por cliente e nunca um E.164 (ninguém recebe nada). */
export const anonPhone = (id: string) => `anon:${id}`;

/**
 * Exclui a cliente. Sem agendamentos nem movimento na carteira, apaga de vez. Com histórico, anonimiza (LGPD): some nome, telefone,
 * e-mail, observações e conversa; os atendimentos ficam como "Cliente removida" para o financeiro não mudar.
 */
export async function deleteClientRow(tx: Tx, id: string): Promise<ActionResult> {
  const [used] = await tx
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.clientId, id))
    .limit(1);
  // Movimento na carteira também é histórico financeiro: anonimiza em vez de apagar
  const [moved] = used
    ? [used]
    : await tx.select({ id: clientLedger.id }).from(clientLedger).where(eq(clientLedger.clientId, id)).limit(1);
  if (!moved) {
    await tx.delete(clients).where(eq(clients.id, id));
    return ok();
  }
  await tx.delete(messages).where(eq(messages.clientId, id));
  // Respostas não entendidas guardadas para análise também saem (LGPD)
  await tx.delete(unclearReplies).where(eq(unclearReplies.clientId, id));
  await tx
    .update(clients)
    .set({ name: "Cliente removida", phoneE164: anonPhone(id), email: null, notes: null, anonymizedAt: new Date() })
    .where(eq(clients.id, id));
  return ok();
}

/**
 * Antes de excluir em lote: das escolhidas, quantas existem neste salão (RLS) e ainda não foram
 * anonimizadas, quantas serão só anonimizadas (têm histórico, mesma regra de `deleteClientRow`)
 * e quantas têm horário marcado daqui para frente (o horário fica, como na exclusão de uma só).
 */
export async function bulkDeletePreview(tx: Tx, ids: string[], now = new Date()) {
  if (ids.length === 0) return { found: 0, anonymize: 0, future: 0 };
  const rows = await tx
    .select({
      id: clients.id,
      history: sql<boolean>`(exists (select 1 from appointments a where a.client_id = clients.id)
        or exists (select 1 from client_ledger l where l.client_id = clients.id))`,
      future: sql<boolean>`exists (select 1 from appointments f where f.client_id = clients.id
        and f.status <> 'cancelled' and f.starts_at > ${now.toISOString()}::timestamptz)`,
    })
    .from(clients)
    .where(and(inArray(clients.id, ids), isNull(clients.anonymizedAt)));
  return {
    found: rows.length,
    anonymize: rows.filter((r) => r.history).length,
    future: rows.filter((r) => r.future).length,
  };
}

/**
 * Exclui várias clientes, cada uma com a regra de `deleteClientRow` (apaga ou anonimiza).
 * Cada uma num savepoint: se uma falhar, as outras seguem. Só entram as do salão ativo (RLS)
 * e ainda não anonimizadas; o resto conta como falha.
 */
export async function deleteClientRows(tx: Tx, ids: string[]) {
  const unique = [...new Set(ids)];
  const found = unique.length
    ? await tx
        .select({ id: clients.id })
        .from(clients)
        .where(and(inArray(clients.id, unique), isNull(clients.anonymizedAt)))
    : [];
  let removed = 0;
  let anonymized = 0;
  for (const { id } of found) {
    try {
      const kind = await tx.transaction(async (sp) => {
        const res = await deleteClientRow(sp, id);
        if (!res.ok) throw new Error(res.code);
        const [left] = await sp.select({ id: clients.id }).from(clients).where(eq(clients.id, id));
        return left ? "anonymized" : "removed";
      });
      if (kind === "removed") removed++;
      else anonymized++;
    } catch {
      // savepoint desfeito: esta cliente fica como estava
    }
  }
  return { removed, anonymized, failed: unique.length - removed - anonymized };
}

/** Resumo do cartão da cliente: próximo horário, última visita, quantas vezes veio, quanto gastou e faltas. */
/**
 * "Para chamar": clientes cujo retorno da última visita vence entre `from` e `to` (datas do estúdio),
 * sem "Não precisa" e sem nenhum horário marcado daqui para frente. Mais atrasada primeiro.
 */
export function listDueReturns(tx: Tx, from: string, to: string, now = new Date()) {
  return tx
    .select({
      appointmentId: appointments.id,
      clientId: clients.id,
      name: clients.name,
      phoneE164: clients.phoneE164,
      due: appointments.returnDueOn,
      service: serviceLabel,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(
      and(
        eq(appointments.status, "done"),
        between(appointments.returnDueOn, from, to),
        isNull(appointments.returnSkippedAt),
        isNull(clients.anonymizedAt),
        // é a visita concluída mais recente dela
        sql`not exists (select 1 from appointments x where x.client_id = ${appointments.clientId}
          and x.status = 'done' and x.starts_at > ${appointments.startsAt})`,
        // e não tem nada marcado daqui para frente
        sql`not exists (select 1 from appointments y where y.client_id = ${appointments.clientId}
          and y.status <> 'cancelled' and y.starts_at > ${now.toISOString()}::timestamptz)`,
      ),
    )
    .orderBy(asc(appointments.returnDueOn), asc(clients.name))
    .limit(50);
}

/** Quantas visitas o cartão da cliente mostra no histórico. */
export const HISTORY = 5;

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
  const [[next], [last], [totals], [faltas], visits] = await Promise.all([
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
    // Histórico: as últimas visitas concluídas, a mais recente primeiro (uma a mais para o intervalo da última)
    tx
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        service: serviceLabel,
        returnDueOn: appointments.returnDueOn,
        returnSkippedAt: appointments.returnSkippedAt,
      })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(and(mine, lt(appointments.startsAt, now), eq(appointments.status, "done")))
      .orderBy(desc(appointments.startsAt))
      .limit(HISTORY + 1),
  ]);
  // Retorno: o da visita mais recente, se ela tem data e não foi dispensado
  const latest = visits[0];
  const ret =
    latest?.returnDueOn && !latest.returnSkippedAt
      ? { appointmentId: latest.id, due: latest.returnDueOn, service: latest.service }
      : null;
  return {
    next: next ?? null,
    last: last ?? null,
    visits: totals?.visits ?? 0,
    spentCents: Number(totals?.spent ?? 0),
    noShows: faltas?.n ?? 0,
    history: visits.map((v) => ({ startsAt: v.startsAt, service: v.service })),
    ret,
  };
}

/** Números de cada cliente para a lista do desktop e os filtros: visitas, última visita, gasto e se tem horário marcado. */
export function clientStats(tx: Tx, now = new Date()) {
  const at = now.toISOString();
  return tx
    .select({
      clientId: appointments.clientId,
      visits: sql<number>`count(*) filter (where ${appointments.status} = 'done')`.mapWith(Number),
      lastVisit: sql<Date | null>`max(${appointments.startsAt}) filter (where ${appointments.status} = 'done')`.mapWith(
        (v) => (v ? new Date(v) : null),
      ),
      spentCents:
        sql<number>`coalesce(sum(${appointments.priceCents}) filter (where ${appointments.status} = 'done'), 0)`.mapWith(
          Number,
        ),
      hasNext:
        sql<boolean>`bool_or(${appointments.status} <> 'cancelled' and ${appointments.startsAt} > ${at}::timestamptz)`.mapWith(
          Boolean,
        ),
    })
    .from(appointments)
    .groupBy(appointments.clientId);
}
