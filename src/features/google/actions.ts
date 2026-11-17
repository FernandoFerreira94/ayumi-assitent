"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getDb, withTenant } from "@/db/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { mayEditAppointments } from "@/features/team/guard";
import { canAs } from "@/features/team/permissions";
import { revokeToken } from "./calendar";
import { calendarProfessionalId } from "@/features/team/professional";
import { professionalGoogleAccount, syncAppointmentSafe } from "./server";

/**
 * Desliga o Google Agenda da profissional do login (owner/admin sem profissional ligada: a padrão do salão):
 * apaga o vínculo (e os tokens) da conta Google do login ligado a ela.
 * Não apaga se for a única forma de entrar no app (a conta ficaria sem acesso).
 */
export async function disconnectGoogle(): Promise<ActionResult<{ onlyLogin?: boolean }>> {
  const me = await requireTenant();
  try {
    const professionalId = await calendarProfessionalId(me);
    if (!canAs(me, "calendar.own", professionalId)) return fail("FORBIDDEN");
    const acc = await professionalGoogleAccount(professionalId);
    if (!acc) return ok();
    const [{ others }] = await getDb().execute<{ others: number }>(
      sql`select count(*)::int as others from account o where o."userId" = ${acc.userId} and o.id <> ${acc.id}`,
    );
    if (others === 0) return fail("VALIDATION", "google");
    // Revoga no Google antes de apagar (revogar o refresh derruba o acesso todo); falha não impede desligar
    const token = acc.refreshToken ?? acc.accessToken;
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
  const me = await requireTenant();
  const { tenantId } = me;
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  if (!(await withTenant(tenantId, (tx) => mayEditAppointments(tx, me, [p.data])))) return fail("FORBIDDEN");
  const r = await syncAppointmentSafe(tenantId, p.data);
  if (r === "auth") return fail("GOOGLE_EXPIRED");
  if (r === "failed") return fail("NETWORK");
  revalidatePath("/pendencias");
  revalidatePath("/agenda");
  revalidatePath("/calendario");
  return ok();
}
