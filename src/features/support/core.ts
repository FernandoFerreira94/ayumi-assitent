// Lado do salão: roda dentro de withTenant (app_user + RLS), então só enxerga a própria conversa.
import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { SUPPORT_MAX_PER_HOUR, type PlatformNotice, type SupportMessage } from "./rules";

type MsgRow = { id: string; author: "salon" | "admin"; body: string; created_at: string | Date; read_at: string | Date | null };
const toMsg = (r: MsgRow): SupportMessage => ({
  id: r.id,
  author: r.author,
  body: r.body,
  createdAt: new Date(r.created_at),
  readAt: r.read_at ? new Date(r.read_at) : null,
});

/** Últimas mensagens da conversa (da mais antiga para a mais nova). */
export async function listSupportMessages(tx: Tx, limit = 100): Promise<SupportMessage[]> {
  const rows = await tx.execute<MsgRow>(sql`
    select * from (
      select id, author, body, created_at, read_at from support_messages order by created_at desc limit ${limit}
    ) m order by created_at`);
  return rows.map(toMsg);
}

/** Respostas do dono ainda não lidas pelo salão (linha de Ajustes e cartão do Painel). */
export async function unreadSupportReplies(tx: Tx): Promise<number> {
  const [r] = await tx.execute<{ n: number }>(
    sql`select count(*)::int as n from support_messages where author = 'admin' and read_at is null`,
  );
  return r?.n ?? 0;
}

export async function markSupportRepliesRead(tx: Tx): Promise<void> {
  await tx.execute(sql`update support_messages set read_at = now() where author = 'admin' and read_at is null`);
}

export type SendResult = { status: "sent"; notifyAdmin: boolean } | { status: "rate_limited" };

/**
 * Grava a mensagem do salão. `notifyAdmin` só quando não havia nada esperando resposta: uma conversa
 * com 3 mensagens seguidas gera um aviso, não três.
 */
export async function sendSupportMessage(tx: Tx, tenantId: string, userId: string, body: string): Promise<SendResult> {
  // Serializa envios do mesmo salão (o limite por hora não estoura com toques em paralelo)
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`support:${tenantId}`}))`);
  const [c] = await tx.execute<{ hour: number; waiting: number }>(sql`
    select
      count(*) filter (where author = 'salon' and created_at > now() - interval '1 hour')::int as hour,
      count(*) filter (where author = 'salon' and read_at is null)::int as waiting
    from support_messages`);
  if ((c?.hour ?? 0) >= SUPPORT_MAX_PER_HOUR) return { status: "rate_limited" };
  await tx.execute(
    sql`insert into support_messages (tenant_id, author, user_id, body) values (${tenantId}, 'salon', ${userId}, ${body})`,
  );
  return { status: "sent", notifyAdmin: (c?.waiting ?? 0) === 0 };
}

type NoticeRow = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "important";
  ends_at: string | Date | null;
  ended_at: string | Date | null;
  created_at: string | Date;
};
export const toNotice = (r: NoticeRow): PlatformNotice => ({
  id: r.id,
  title: r.title,
  body: r.body,
  tone: r.tone,
  endsAt: r.ends_at ? new Date(r.ends_at) : null,
  endedAt: r.ended_at ? new Date(r.ended_at) : null,
  createdAt: new Date(r.created_at),
});

/** Avisos do dono que esta pessoa ainda não fechou (no máximo 3, os mais novos; importante na frente). */
export async function liveNoticesFor(tx: Tx, userId: string): Promise<PlatformNotice[]> {
  const rows = await tx.execute<NoticeRow>(sql`
    select n.id, n.title, n.body, n.tone, n.ends_at, n.ended_at, n.created_at
    from platform_notices n
    where n.ended_at is null and (n.ends_at is null or n.ends_at > now())
      and not exists (select 1 from platform_notice_dismissals d where d.notice_id = n.id and d.user_id = ${userId})
    order by (n.tone = 'important') desc, n.created_at desc
    limit 3`);
  return rows.map(toNotice);
}

export async function dismissNotice(tx: Tx, tenantId: string, userId: string, noticeId: string): Promise<void> {
  await tx.execute(sql`
    insert into platform_notice_dismissals (notice_id, tenant_id, user_id)
    select id, ${tenantId}, ${userId} from platform_notices where id = ${noticeId}
    on conflict do nothing`);
}
