import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/guard";
import type { FeedbackRow } from "./feedback";

/** Rotina de plataforma (dono do banco, todos os salões): respostas do feedback, mais novas primeiro. Sem e-mail nem nome da pessoa. */
export async function listLaunchFeedback(): Promise<FeedbackRow[]> {
  await requireAdmin();
  const rows = await getDb().execute<{
    salon: string;
    helps: string | null;
    missing: string | null;
    score: number | null;
    skipped: boolean;
    created_at: string | Date;
  }>(sql`
    select t.name as salon, f.helps, f.missing, f.score, f.skipped, f.created_at
      from launch_feedback f join tenants t on t.id = f.tenant_id
     order by f.created_at desc
     limit 500`);
  return rows.map((r) => ({
    salon: r.salon,
    helps: r.helps,
    missing: r.missing,
    score: r.score,
    skipped: r.skipped,
    createdAt: new Date(r.created_at),
  }));
}
