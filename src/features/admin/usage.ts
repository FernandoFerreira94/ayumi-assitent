import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAdmin } from "./guard";
import type { UsageRow } from "./usage-rules";

const d = (v: string | Date | null) => (v ? new Date(v) : null);

/**
 * Rotina de plataforma: roda como dono do banco em todos os salões, igual ao worker de lembretes e à limpeza.
 * "Último uso" = sessão renovada ou login mais recente de quem é membro do salão.
 */
export async function getUsage(): Promise<UsageRow[]> {
  await requireAdmin();
  const rows = await getDb().execute<{
    id: string;
    name: string;
    owner_name: string | null;
    created_at: string | Date;
    last_seen: string | Date | null;
    whatsapp: boolean;
    clients: number;
    appts30: number;
    out30: number;
    in30: number;
  }>(sql`
    select t.id, t.name, t.owner_name, t.created_at,
      (select greatest(max(s."updatedAt"), max(al.created_at))
         from memberships m
         left join session s on s."userId" = m.user_id
         left join access_log al on al.user_id = m.user_id
        where m.tenant_id = t.id) as last_seen,
      t.whatsapp_instance is not null as whatsapp,
      (select count(*)::int from clients c where c.tenant_id = t.id and c.anonymized_at is null) as clients,
      (select count(*)::int from appointments a
        where a.tenant_id = t.id and a.status <> 'cancelled'
          and a.starts_at >= now() - interval '30 days' and a.starts_at < now()) as appts30,
      (select count(*)::int from messages ms
        where ms.tenant_id = t.id and ms.direction = 'out' and ms.created_at >= now() - interval '30 days') as out30,
      (select count(*)::int from messages ms
        where ms.tenant_id = t.id and ms.direction = 'in' and ms.created_at >= now() - interval '30 days') as in30
    from tenants t
    order by t.created_at desc`);
  return rows.map((r) => ({
    tenantId: r.id,
    salonName: r.name,
    ownerName: r.owner_name,
    createdAt: new Date(r.created_at),
    lastSeenAt: d(r.last_seen),
    whatsapp: r.whatsapp,
    clients: r.clients,
    appts30: r.appts30,
    msgsOut30: r.out30,
    msgsIn30: r.in30,
  }));
}
