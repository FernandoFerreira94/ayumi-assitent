import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/guard";
import { groupUnclear, type UnclearGroup, type UnclearRow } from "./unclear-rules";
import type { UnclearLabel } from "./unclear";

/**
 * Rotina de plataforma (dono do banco, todos os salões): respostas não entendidas dos últimos 90 dias, agrupadas
 * por padrão. Sem telefone e sem nome da cliente: só o texto, o salão e o que o sistema fez.
 */
export async function listUnclear(): Promise<UnclearGroup[]> {
  await requireAdmin();
  const rows = await getDb().execute<{
    id: string;
    salon: string;
    body: string;
    question: string;
    ai_intent: string | null;
    decision: string;
    label: string | null;
    created_at: string | Date;
  }>(sql`
    select u.id, t.name as salon, u.body, u.question, u.ai_intent, u.decision, u.label, u.created_at
      from unclear_replies u join tenants t on t.id = u.tenant_id
     order by u.created_at desc
     limit 1000`);
  return groupUnclear(
    rows.map((r): UnclearRow => ({
      id: r.id,
      salon: r.salon,
      body: r.body,
      question: r.question as UnclearRow["question"],
      aiIntent: r.ai_intent,
      decision: r.decision as UnclearRow["decision"],
      label: r.label as UnclearLabel | null,
      createdAt: new Date(r.created_at),
    })),
  );
}

/** Dá (ou tira) o rótulo de várias mensagens de uma vez (um grupo). Devolve quantas mudaram. */
export async function setUnclearLabel(ids: string[], label: UnclearLabel | null): Promise<number> {
  if (ids.length === 0) return 0;
  const r = await getDb().execute<{ id: string }>(
    sql`update unclear_replies set label = ${label}, labeled_at = ${label ? sql`now()` : null}
         where id in (${sql.join(
           ids.map((i) => sql`${i}::uuid`),
           sql`, `,
         )})
         returning id`,
  );
  return r.length;
}
