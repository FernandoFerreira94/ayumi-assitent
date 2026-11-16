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

/** Todos os logins do salão com o papel e a profissional de cada um (a tabela memberships só o papel dono do banco lê). */
export async function membersOf(tenantId: string): Promise<{ userId: string; role: Membership["role"]; professionalId: string | null }[]> {
  const rows = await getDb().execute<{ user_id: string; role: Membership["role"]; professional_id: string | null }>(
    sql`select user_id, role, professional_id from memberships where tenant_id = ${tenantId}`,
  );
  return (rows as unknown as { user_id: string; role: Membership["role"]; professional_id: string | null }[]).map((r) => ({
    userId: r.user_id,
    role: r.role,
    professionalId: r.professional_id,
  }));
}
