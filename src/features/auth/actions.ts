"use server";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/db/client";
import { auth } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { errCode, log } from "@/lib/log";

const schema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
    password: z.string().min(8).max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"] });

/**
 * Página de nova senha: troca a senha pelo link do e-mail (token de uso único do Better Auth) e já entra.
 * O Better Auth não abre sessão depois do reset; por isso, antes de gastar o token, guardamos de quem ele é e,
 * com a senha nova, fazemos o login normal (signInEmail): registra o acesso e respeita o 2FA do painel do dono.
 * `twoFactor`: conta com 2FA; a senha mudou, mas o código é pedido na tela de login.
 */
export async function resetPasswordAndSignIn(
  _prev: ActionResult<{ twoFactor: boolean }> | null,
  fd: FormData,
): Promise<ActionResult<{ twoFactor: boolean }>> {
  const p = schema.safeParse({ token: fd.get("token"), password: fd.get("password"), confirm: fd.get("confirm") });
  if (!p.success) {
    const field = String(p.error.issues[0]?.path[0] ?? "password");
    return field === "token" ? fail("RESET_LINK_INVALID") : fail("VALIDATION", field);
  }
  const { token, password } = p.data;
  try {
    const rows = await getDb().execute<{ email: string }>(sql`
      select u.email from verification v join "user" u on u.id = v.value
      where v.identifier = ${`reset-password:${token}`} and v."expiresAt" > now()
      limit 1`);
    const email = rows[0]?.email;
    if (!email) return fail("RESET_LINK_INVALID");

    try {
      await auth.api.resetPassword({ body: { token, newPassword: password } });
    } catch (e) {
      const code = (e as { body?: { code?: string } })?.body?.code ?? "";
      if (code === "INVALID_TOKEN") return fail("RESET_LINK_INVALID");
      if (code.startsWith("PASSWORD_TOO")) return fail("VALIDATION", "password");
      throw e;
    }

    const res = await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
    return ok({ twoFactor: !!(res && "twoFactorRedirect" in res && res.twoFactorRedirect) });
  } catch (e) {
    log("error", "auth.reset_password_failed", errCode(e));
    return fail("UNKNOWN");
  }
}
