import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/** Mascote de cada pessoa do estúdio (a tabela memberships só o papel dono do banco lê). */
export async function mascotsOf(tenantId: string): Promise<Record<string, string>> {
  const rows = await getDb().execute<{ user_id: string; mascot: string }>(
    sql`select user_id, mascot from memberships where tenant_id = ${tenantId}`,
  );
  return Object.fromEntries(
    (rows as unknown as { user_id: string; mascot: string }[]).map((r) => [r.user_id, r.mascot]),
  );
}
