"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { revokeToken } from "./calendar";
import { syncAppointmentSafe } from "./server";
import { readToken } from "./token-crypto";

/**
 * Desliga o Google Agenda: apaga o vínculo (e os tokens) da conta Google do dono do estúdio.
 * Não apaga se for a única forma de entrar no app (a conta ficaria sem acesso).
 */
export async function disconnectGoogle(): Promise<ActionResult<{ onlyLogin?: boolean }>> {
  const { tenantId } = await requireTenant();
  try {
    const rows = await getDb().execute<{ id: string; others: number; refresh: string | null; access: string | null }>(sql`
      select a.id, a."refreshToken" as refresh, a."accessToken" as access,
             (select count(*)::int from account o where o."userId" = a."userId" and o.id <> a.id) as others
      from account a join memberships m on m.user_id = a."userId"
      where m.tenant_id = ${tenantId} and m.role = 'owner' and a."providerId" = 'google'
      limit 1`);
    const acc = rows[0];
    if (!acc) return ok();
    if (acc.others === 0) return fail("VALIDATION", "google");
    // Revoga no Google antes de apagar (revogar o refresh derruba o acesso todo); falha não impede desligar
    const token = (await readToken(acc.refresh).catch(() => null)) ?? (await readToken(acc.access).catch(() => null));
    if (token) await revokeToken(token).catch(() => undefined);
    await getDb().execute(sql`delete from account where id = ${acc.id}`);
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch (e) {
    console.error("google_disconnect_failed", { error: e instanceof Error ? e.message : String(e) });
    return fail("UNKNOWN");
  }
}

const passwordSchema = z
  .object({ password: z.string().min(8).max(128), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"] });

/**
 * Cria a senha de quem só entra pelo Google (Better Auth `setPassword`: vincula a conta "credential"
 * ao usuário logado). Depois disso dá para desconectar o Google e entrar com e-mail + senha.
 * Senha já existente conta como sucesso: o objetivo (ter outra entrada) já está cumprido.
 */
export async function createPassword(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireTenant();
  const p = passwordSchema.safeParse({ password: fd.get("password"), confirm: fd.get("confirm") });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? "password"));
  try {
    await auth.api.setPassword({ body: { newPassword: p.data.password }, headers: await headers() });
  } catch (e) {
    const code = (e as { body?: { code?: string } })?.body?.code ?? "";
    if (code === "PASSWORD_ALREADY_SET") return ok();
    if (code.startsWith("PASSWORD_TOO")) return fail("VALIDATION", "password");
    console.error("set_password_failed", { code, error: e instanceof Error ? e.message : String(e) });
    return fail("UNKNOWN");
  }
  return ok();
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
