import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireSession } from "./session";
import { redirect } from "next/navigation";

/** Usuário logado + estúdio dele. Sem vínculo, volta ao login. */
export async function requireTenant() {
  const session = await requireSession();
  const rows = await getDb().execute<{ tenant_id: string }>(
    sql`select tenant_id from memberships where user_id = ${session.user.id} limit 1`,
  );
  const tenantId = rows[0]?.tenant_id;
  if (!tenantId) redirect("/login?error=NOT_ALLOWED");
  return { userId: session.user.id, userName: session.user.name, tenantId };
}
