import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { Actor } from "./permissions";

export type Membership = Actor & { tenantId: string };

/** O vínculo do login com o salão (um só por pessoa: índice único em `memberships.user_id`). */
export async function membershipOf(userId: string): Promise<Membership | null> {
  const rows = await getDb().execute<{ tenant_id: string; role: Membership["role"]; professional_id: string | null }>(
    sql`select tenant_id, role, professional_id from memberships where user_id = ${userId}`,
  );
  const m = rows[0];
  return m ? { tenantId: m.tenant_id, role: m.role, professionalId: m.professional_id } : null;
}
