import "server-only";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { notifyPendencias, type PushRun } from "./core";
import type { PushPort } from "./port";
import { errCode } from "@/lib/log";

export async function runPushPendencias(port: PushPort, now = new Date()): Promise<PushRun> {
  const all = await getDb().select({ id: tenants.id }).from(tenants);
  const total: PushRun = { sent: 0, removed: 0, failed: 0 };
  for (const t of all) {
    try {
      const r = await withTenant(t.id, (tx) => notifyPendencias(tx, port, now, false));
      total.sent += r.sent;
      total.removed += r.removed;
      total.failed += r.failed;
    } catch (e) {
      console.error(JSON.stringify({ level: "error", msg: "push_tenant_failed", tenant: t.id, ...errCode(e) }));
      total.failed++;
    }
  }
  return total;
}
