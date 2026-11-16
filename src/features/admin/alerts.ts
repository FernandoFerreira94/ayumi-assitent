// Avisos para o dono do produto no celular (push do próprio app, nos aparelhos em que ele ligou as
// notificações). Rotina de plataforma: roda como dono do banco (worker e hook de cadastro), sem requireAdmin.
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { WhatsAppAdmin } from "@/features/messaging/evolution-admin";
import { PushGoneError, type PushPayload, type PushPort } from "@/features/push/port";
import { errCode, log } from "@/lib/log";
import { adminIds } from "./access";
import type { Digest } from "./alerts-text";

/** Manda para todos os aparelhos inscritos de quem está em ADMIN_USER_IDS. Inscrição vencida é apagada. */
export async function notifyAdmins(push: PushPort, payload: PushPayload, ids = adminIds()) {
  const run = { sent: 0, removed: 0, failed: 0 };
  if (!ids.length) return run;
  const subs = await getDb().execute<{ id: string; endpoint: string; p256dh: string; auth: string; user_id: string; tenant_id: string }>(
    sql`select id, endpoint, p256dh, auth, user_id, tenant_id from push_subscriptions
        where user_id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`,
  );
  for (const s of subs) {
    try {
      await push.send({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth, userId: s.user_id, tenantId: s.tenant_id }, payload);
      run.sent++;
    } catch (e) {
      if (e instanceof PushGoneError) {
        await getDb().execute(sql`delete from push_subscriptions where id = ${s.id}`);
        run.removed++;
      } else run.failed++;
    }
  }
  return run;
}

/** Números de ontem (dia de UTC-3) para o resumo da manhã. `down` = salões com WhatsApp caído. */
export async function collectDigest(now: Date, wa: WhatsAppAdmin | null): Promise<Digest> {
  const [r] = await getDb().execute<{
    new_salons: number;
    active: number;
    appts: number;
    msgs: number;
    idle: number;
  }>(sql`
    with y as (
      select (date_trunc('day', ${now.toISOString()}::timestamptz at time zone 'America/Sao_Paulo') - interval '1 day')
               at time zone 'America/Sao_Paulo' as d0,
             date_trunc('day', ${now.toISOString()}::timestamptz at time zone 'America/Sao_Paulo')
               at time zone 'America/Sao_Paulo' as d1
    ),
    seen as (
      select m.tenant_id, greatest(max(s."updatedAt"), max(al.created_at)) as last_seen
      from memberships m
      left join session s on s."userId" = m.user_id
      left join access_log al on al.user_id = m.user_id
      group by m.tenant_id
    )
    select
      (select count(*)::int from tenants, y where created_at >= y.d0 and created_at < y.d1) as new_salons,
      (select count(*)::int from seen, y where last_seen >= y.d0) as active,
      (select count(*)::int from appointments a, y where a.created_at >= y.d0 and a.created_at < y.d1) as appts,
      (select count(*)::int from messages ms, y
        where ms.direction = 'out' and ms.created_at >= y.d0 and ms.created_at < y.d1) as msgs,
      (select count(*)::int from tenants t left join seen on seen.tenant_id = t.id
        where t.created_at < ${now.toISOString()}::timestamptz - interval '7 days'
          and (seen.last_seen is null or seen.last_seen < ${now.toISOString()}::timestamptz - interval '7 days')) as idle`);

  let whatsappDown = 0;
  if (wa) {
    const inst = await getDb().execute<{ i: string }>(sql`select whatsapp_instance as i from tenants where whatsapp_instance is not null`);
    for (const { i } of inst) {
      try {
        if ((await wa.state(i)) === "close") whatsappDown++;
      } catch (e) {
        log("warn", "admin_digest_wa_state_failed", errCode(e));
      }
    }
  }
  return {
    newSalons: r.new_salons,
    activeSalons: r.active,
    appointments: r.appts,
    messagesOut: r.msgs,
    whatsappDown,
    idleSalons: r.idle,
  };
}
