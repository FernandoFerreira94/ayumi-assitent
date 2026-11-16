"use server";

import { headers } from "next/headers";
import QRCode from "qrcode";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { errCode, log } from "@/lib/log";
import { logAdminAccess } from "./audit";
import { requireAdmin, requireAdminWithoutTwoFactor } from "./guard";
import { recentFailures, recordStepUp, stepUpLockedUntil } from "./step-up";

const TOTP = /^\d{6}$/;
// Código de recuperação do Better Auth: 10 caracteres com hífen no meio (ex.: AbCde-FgHij)
const BACKUP = /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/;
const codeSchema = z.object({
  code: z
    .string()
    .transform((s) => s.replace(/\s+/g, ""))
    .refine((s) => TOTP.test(s) || BACKUP.test(s)),
});
const passwordSchema = z.object({ password: z.string().max(128).optional() });

const apiCode = (e: unknown) => (e as { body?: { code?: string } })?.body?.code ?? "";

async function isLocked(userId: string) {
  return stepUpLockedUntil(await recentFailures(userId), new Date()) !== null;
}

/** Confere o código (app autenticador ou recuperação) e libera o painel por 12 h nesta sessão. */
export async function verifyAdminCode(input: { code: string }): Promise<ActionResult> {
  const { userId, sessionId } = await requireAdmin({ stepUp: false });
  const p = codeSchema.safeParse(input);
  if (!p.success) return fail("ADMIN_STEP_UP_INVALID", "code");
  if (await isLocked(userId)) return fail("ADMIN_STEP_UP_LOCKED");
  // Código de recuperação sem o hífen também vale (o app guarda com hífen no meio)
  const code = TOTP.test(p.data.code) || p.data.code.includes("-") ? p.data.code : `${p.data.code.slice(0, 5)}-${p.data.code.slice(5)}`;
  try {
    const h = await headers();
    if (TOTP.test(code)) await auth.api.verifyTOTP({ body: { code }, headers: h });
    else await auth.api.verifyBackupCode({ body: { code, disableSession: true }, headers: h });
  } catch (e) {
    await logAdminAccess({ userId, action: "step_up_failed" });
    const c = apiCode(e);
    if (c.startsWith("INVALID")) return fail("ADMIN_STEP_UP_INVALID", "code");
    log("warn", "admin_step_up_error", errCode(e));
    return fail("UNKNOWN");
  }
  await recordStepUp(sessionId, userId);
  await logAdminAccess({ userId, action: "step_up_ok" });
  return ok();
}

/** Passo 1 da ativação: gera o segredo (QR) e os códigos de recuperação, ainda sem ligar o 2FA. */
export async function startTwoFactorSetup(input: {
  password?: string;
}): Promise<ActionResult<{ qr: string; secret: string; backupCodes: string[] }>> {
  const { enabled } = await requireAdminWithoutTwoFactor();
  if (enabled) return fail("VALIDATION");
  const p = passwordSchema.safeParse(input);
  if (!p.success) return fail("VALIDATION", "password");
  try {
    const r = await auth.api.enableTwoFactor({
      body: { password: p.data.password || undefined, issuer: "Bubbly Admin" },
      headers: await headers(),
    });
    if (!("totpURI" in r) || !r.totpURI) return fail("UNKNOWN");
    const secret = new URL(r.totpURI).searchParams.get("secret") ?? "";
    const qr = await QRCode.toDataURL(r.totpURI, { margin: 1, width: 240 });
    return ok({ qr, secret, backupCodes: r.backupCodes ?? [] });
  } catch (e) {
    if (apiCode(e) === "INVALID_PASSWORD") return fail("ADMIN_PASSWORD_REQUIRED", "password");
    log("warn", "admin_2fa_setup_error", errCode(e));
    return fail("UNKNOWN");
  }
}

/**
 * Passo final: o primeiro código do app liga o 2FA. O Better Auth troca a sessão nessa hora (cookie novo),
 * então o step-up não é gravado aqui: a tela segue para /admin/verificar e pede um código de novo.
 */
export async function confirmTwoFactorSetup(input: { code: string }): Promise<ActionResult> {
  const { userId, enabled } = await requireAdminWithoutTwoFactor();
  if (enabled) return ok();
  const p = codeSchema.safeParse(input);
  if (!p.success || !TOTP.test(p.data.code)) return fail("ADMIN_STEP_UP_INVALID", "code");
  if (await isLocked(userId)) return fail("ADMIN_STEP_UP_LOCKED");
  try {
    await auth.api.verifyTOTP({ body: { code: p.data.code }, headers: await headers() });
  } catch (e) {
    await logAdminAccess({ userId, action: "step_up_failed" });
    if (apiCode(e).startsWith("INVALID")) return fail("ADMIN_STEP_UP_INVALID", "code");
    log("warn", "admin_2fa_confirm_error", errCode(e));
    return fail("UNKNOWN");
  }
  await logAdminAccess({ userId, action: "2fa_enabled" });
  return ok();
}

/** Troca os 10 códigos de recuperação (os antigos deixam de valer). */
export async function regenerateBackupCodes(input: {
  password?: string;
}): Promise<ActionResult<{ backupCodes: string[] }>> {
  const { userId } = await requireAdmin();
  const p = passwordSchema.safeParse(input);
  if (!p.success) return fail("VALIDATION", "password");
  try {
    const r = await auth.api.generateBackupCodes({
      body: { password: p.data.password || undefined },
      headers: await headers(),
    });
    await logAdminAccess({ userId, action: "backup_codes_regenerated" });
    return ok({ backupCodes: r.backupCodes });
  } catch (e) {
    if (apiCode(e) === "INVALID_PASSWORD") return fail("ADMIN_PASSWORD_REQUIRED", "password");
    log("warn", "admin_backup_codes_error", errCode(e));
    return fail("UNKNOWN");
  }
}
