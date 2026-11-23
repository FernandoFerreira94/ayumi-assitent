import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAdmin } from "./guard";
import type { PlatformMonth, PlatformTotals } from "./platform-rules";

/**
 * Números reais da plataforma para a visão geral (não dependem da cobrança). Só contagens agregadas de todos os
 * salões: nenhum nome, telefone ou mensagem de cliente sai daqui. Roda como dono do banco, igual a usage.ts.
 * Meses no fuso de São Paulo; os limites viram timestamptz para os índices de starts_at/created_at valerem.
 */
export async function getPlatformStats(): Promise<{ totals: PlatformTotals; months: PlatformMonth[] }> {
  await requireAdmin();
  const db = getDb();
  const [totalsRows, monthRows] = await Promise.all([
    db.execute<{
      clients: number;
      users: number;
      appts_month: number;
      appts_prev: number;
      msgs_out: number;
      msgs_in: number;
    }>(sql`
      with b as (
        select (date_trunc('month', now() at time zone 'America/Sao_Paulo')) at time zone 'America/Sao_Paulo' as m0,
               (date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '1 month') at time zone 'America/Sao_Paulo' as m1,
               (date_trunc('month', now() at time zone 'America/Sao_Paulo') + interval '1 month') at time zone 'America/Sao_Paulo' as m2
      )
      select
        (select count(*)::int from clients c where c.anonymized_at is null) as clients,
        (select count(distinct m.user_id)::int from memberships m) as users,
        (select count(*)::int from appointments a, b
          where a.status <> 'cancelled' and a.starts_at >= b.m0 and a.starts_at < b.m2) as appts_month,
        (select count(*)::int from appointments a, b
          where a.status <> 'cancelled' and a.starts_at >= b.m1 and a.starts_at < b.m0) as appts_prev,
        (select count(*)::int from messages ms, b where ms.direction = 'out' and ms.created_at >= b.m0) as msgs_out,
        (select count(*)::int from messages ms, b where ms.direction = 'in' and ms.created_at >= b.m0) as msgs_in`),
    db.execute<{ month: string; salons: number; appts: number }>(sql`
      with m as (
        select gs as local_start,
               gs at time zone 'America/Sao_Paulo' as m_start,
               (gs + interval '1 month') at time zone 'America/Sao_Paulo' as m_end
          from generate_series(
            date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '11 months',
            date_trunc('month', now() at time zone 'America/Sao_Paulo'),
            interval '1 month') gs
      )
      select to_char(m.local_start, 'YYYY-MM-01') as month,
        (select count(*)::int from tenants t where t.created_at >= m.m_start and t.created_at < m.m_end) as salons,
        (select count(*)::int from appointments a
          where a.status <> 'cancelled' and a.starts_at >= m.m_start and a.starts_at < m.m_end) as appts
      from m order by m.local_start`),
  ]);
  const t = totalsRows[0];
  return {
    totals: {
      clients: t.clients,
      users: t.users,
      apptsMonth: t.appts_month,
      apptsPrevMonth: t.appts_prev,
      msgsOutMonth: t.msgs_out,
      msgsInMonth: t.msgs_in,
    },
    months: monthRows.map((r) => ({ month: r.month, salons: r.salons, appts: r.appts })),
  };
}
