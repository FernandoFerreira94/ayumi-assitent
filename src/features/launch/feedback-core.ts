// Lado do salão: roda dentro de withTenant (app_user + RLS), então só enxerga o próprio estúdio.
import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { shouldAskFeedback, type FeedbackInput } from "./feedback";

/** O cartão de feedback deve aparecer para esta pessoa? */
export async function needsFeedback(tx: Tx, tenantId: string, userId: string): Promise<boolean> {
  const [r] = await tx.execute<{ created_at: string | Date; answered: boolean }>(sql`
    select t.created_at,
           exists (select 1 from launch_feedback f where f.tenant_id = t.id and f.user_id = ${userId}) as answered
      from tenants t where t.id = ${tenantId}`);
  if (!r) return false;
  return shouldAskFeedback(new Date(r.created_at), new Date(), r.answered);
}

/** Grava a resposta (ou o "Agora não"). Repetir não troca a primeira: o cartão some depois de uma vez. */
export async function saveFeedback(
  tx: Tx,
  tenantId: string,
  userId: string,
  input: FeedbackInput | "skip",
): Promise<void> {
  const v = input === "skip" ? { helps: null, missing: null, score: null, skipped: true } : { ...input, skipped: false };
  await tx.execute(sql`
    insert into launch_feedback (tenant_id, user_id, helps, missing, score, skipped)
    values (${tenantId}, ${userId}, ${v.helps}, ${v.missing}, ${v.score}, ${v.skipped})
    on conflict do nothing`);
}
