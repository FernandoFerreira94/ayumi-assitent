import "server-only";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import type { PushPort } from "@/features/push/port";
import { holidayGreetingAi, weekPlanAi } from "./ai";
import { runTenantNotices, type NoticeDeps } from "./core";
import { mascotsOf } from "./mascots";

const AI: NoticeDeps["ai"] = { weekPlan: weekPlanAi, holidayGreeting: holidayGreetingAi };

/** Uma rodada de avisos do dia para todos os estúdios. Erro de um não para os outros. */
export async function runOwnerNotices(push: PushPort, now = new Date()) {
  const all = await getDb()
    .select({
      id: tenants.id,
      name: tenants.name,
      ownerName: tenants.ownerName,
      city: tenants.city,
      state: tenants.state,
      latitude: tenants.latitude,
      longitude: tenants.longitude,
      goodMorning: tenants.goodMorning,
    })
    .from(tenants);
  const total = { sent: 0, removed: 0, failed: 0, kinds: [] as string[] };
  for (const t of all) {
    try {
      const mascots = await mascotsOf(t.id).catch(() => ({}));
      const r = await withTenant(t.id, (tx) => runTenantNotices(tx, t.id, push, now, t, { ai: AI, mascots }));
      total.sent += r.sent;
      total.removed += r.removed;
      total.failed += r.failed;
      total.kinds.push(...r.kinds);
    } catch (e) {
      console.error(
        JSON.stringify({ level: "error", msg: "owner_notices_tenant_failed", tenant: t.id, err: String(e) }),
      );
      total.failed++;
    }
  }
  return total;
}
