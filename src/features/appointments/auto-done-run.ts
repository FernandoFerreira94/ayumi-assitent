import "server-only";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { errCode, log } from "@/lib/log";
import { autoConcludePast } from "./core";

/**
 * Ao abrir a agenda: não espera a próxima rodada do worker. Falha aqui não derruba a tela (o worker tenta de novo).
 */
export async function concludePastOnOpen(tenantId: string, now = new Date()): Promise<void> {
  await withTenant(tenantId, (tx) => autoConcludePast(tx, now)).catch((e) =>
    log("warn", "auto_done_open_failed", { tenant: tenantId, ...errCode(e) }),
  );
}

/** Uma rodada para todos os estúdios (worker, a cada 5 min). Erro num estúdio não para os outros. */
export async function runAutoDone(now = new Date()): Promise<{ done: number; failed: number }> {
  const all = await getDb().select({ id: tenants.id }).from(tenants);
  const total = { done: 0, failed: 0 };
  for (const t of all) {
    try {
      total.done += await withTenant(t.id, (tx) => autoConcludePast(tx, now));
    } catch (e) {
      log("warn", "auto_done_tenant_failed", { tenant: t.id, ...errCode(e) });
      total.failed++;
    }
  }
  return total;
}
