import "server-only";
// Lado do dono (painel /admin): lê todas as conversas como dono do banco. Cada função confere o admin de novo.
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/guard";
import { toNotice } from "./core";
import type { Conversation, PlatformNotice, SupportMessage } from "./rules";

/** Uma linha por salão que já escreveu: última mensagem e quantas do salão estão sem leitura. */
export async function listConversations(): Promise<Conversation[]> {
  await requireAdmin();
  const rows = await getDb().execute<{
    tenant_id: string;
    salon_name: string;
    last_body: string;
    last_author: "salon" | "admin";
    last_at: string | Date;
    unread: number;
  }>(sql`
    select distinct on (m.tenant_id)
      m.tenant_id, t.name as salon_name, m.body as last_body, m.author as last_author, m.created_at as last_at,
      (select count(*)::int from support_messages u
        where u.tenant_id = m.tenant_id and u.author = 'salon' and u.read_at is null) as unread
    from support_messages m join tenants t on t.id = m.tenant_id
    order by m.tenant_id, m.created_at desc`);
  return rows.map((r) => ({
    tenantId: r.tenant_id,
    salonName: r.salon_name,
    lastBody: r.last_body,
    lastAuthor: r.last_author,
    lastAt: new Date(r.last_at),
    unread: r.unread,
  }));
}

/** Mensagens do salão sem leitura (número no menu do painel). */
export async function unreadSupportCount(): Promise<number> {
  await requireAdmin();
  const [r] = await getDb().execute<{ n: number }>(
    sql`select count(distinct tenant_id)::int as n from support_messages where author = 'salon' and read_at is null`,
  );
  return r?.n ?? 0;
}

export async function getConversation(tenantId: string): Promise<{ salonName: string; messages: SupportMessage[] } | null> {
  await requireAdmin();
  const [t] = await getDb().execute<{ name: string }>(sql`select name from tenants where id = ${tenantId}`);
  if (!t) return null;
  const rows = await getDb().execute<{ id: string; author: "salon" | "admin"; body: string; created_at: string | Date; read_at: string | Date | null }>(sql`
    select * from (
      select id, author, body, created_at, read_at from support_messages
      where tenant_id = ${tenantId} order by created_at desc limit 200
    ) m order by created_at`);
  return {
    salonName: t.name,
    messages: rows.map((r) => ({
      id: r.id,
      author: r.author,
      body: r.body,
      createdAt: new Date(r.created_at),
      readAt: r.read_at ? new Date(r.read_at) : null,
    })),
  };
}

export async function listNotices(): Promise<PlatformNotice[]> {
  await requireAdmin();
  const rows = await getDb().execute<Parameters<typeof toNotice>[0]>(
    sql`select id, title, body, tone, ends_at, ended_at, created_at from platform_notices order by created_at desc limit 50`,
  );
  return rows.map(toNotice);
}

/** Quantas pessoas já fecharam cada aviso (para saber se foi visto). */
export async function noticeDismissCounts(): Promise<Record<string, number>> {
  await requireAdmin();
  const rows = await getDb().execute<{ notice_id: string; n: number }>(
    sql`select notice_id, count(*)::int as n from platform_notice_dismissals group by notice_id`,
  );
  return Object.fromEntries(rows.map((r) => [r.notice_id, r.n]));
}
