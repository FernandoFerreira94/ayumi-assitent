import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { errCode, log } from "@/lib/log";

export type AdminAction =
  | "view_overview"
  | "view_subscribers"
  | "view_subscriber"
  | "view_payments"
  | "export_payments"
  | "view_security"
  | "step_up_ok"
  | "step_up_failed"
  | "2fa_enabled"
  | "backup_codes_regenerated";

export const ADMIN_ACTION_LABEL: Record<AdminAction, string> = {
  view_overview: "Abriu a visão geral",
  view_subscribers: "Abriu assinantes",
  view_subscriber: "Abriu um salão",
  view_payments: "Abriu pagamentos",
  export_payments: "Exportou pagamentos",
  view_security: "Abriu segurança",
  step_up_ok: "Código confirmado",
  step_up_failed: "Código errado",
  "2fa_enabled": "Ativou o 2FA",
  backup_codes_regenerated: "Gerou novos códigos de recuperação",
};

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

/** Grava quem abriu o quê no painel. Nunca lança: falha de registro não pode derrubar a tela. */
export async function logAdminAccess(input: { userId: string; action: AdminAction; target?: string }): Promise<void> {
  try {
    const ip = await clientIp();
    await getDb().execute(
      sql`insert into admin_audit_log (user_id, action, target, ip)
          values (${input.userId}, ${input.action}, ${input.target ?? null}, ${ip})`,
    );
  } catch (e) {
    log("warn", "admin_audit_failed", { action: input.action, ...errCode(e) });
  }
}

export type AdminAccessRow = { action: AdminAction; target: string | null; ip: string | null; createdAt: Date };

/** Últimos acessos ao painel (tela Segurança). Chame só depois do requireAdmin. */
export async function recentAdminAccess(limit = 50): Promise<AdminAccessRow[]> {
  const rows = await getDb().execute<{ action: AdminAction; target: string | null; ip: string | null; created_at: string | Date }>(
    sql`select action, target, ip, created_at from admin_audit_log order by created_at desc limit ${limit}`,
  );
  return rows.map((r) => ({ action: r.action, target: r.target, ip: r.ip, createdAt: new Date(r.created_at) }));
}
