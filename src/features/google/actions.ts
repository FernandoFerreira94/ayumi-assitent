"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { syncAppointmentSafe } from "./server";

/**
 * Desliga o Google Agenda: apaga o vínculo (e os tokens) da conta Google do dono do estúdio.
 * Não apaga se for a única forma de entrar no app (a conta ficaria sem acesso).
 */
export async function disconnectGoogle(): Promise<ActionResult<{ onlyLogin?: boolean }>> {
  const { tenantId } = await requireTenant();
  try {
    const rows = await getDb().execute<{ id: string; others: number }>(sql`
      select a.id,
             (select count(*)::int from account o where o."userId" = a."userId" and o.id <> a.id) as others
      from account a join memberships m on m.user_id = a."userId"
      where m.tenant_id = ${tenantId} and m.role = 'owner' and a."providerId" = 'google'
      limit 1`);
    const acc = rows[0];
    if (!acc) return ok();
    if (acc.others === 0) return fail("VALIDATION", "google");
    await getDb().execute(sql`delete from account where id = ${acc.id}`);
    revalidatePath("/ajustes");
    return ok();
  } catch (e) {
    console.error("google_disconnect_failed", { error: e instanceof Error ? e.message : String(e) });
    return fail("UNKNOWN");
  }
}

/** Tenta de novo mandar um agendamento para o Google. */
export async function retrySync(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  const r = await syncAppointmentSafe(tenantId, p.data);
  if (r === "auth") return fail("GOOGLE_EXPIRED");
  if (r === "failed") return fail("NETWORK");
  revalidatePath("/pendencias");
  revalidatePath("/agenda");
  revalidatePath("/calendario");
  return ok();
}
