// Escritas do dono (resposta e avisos), como dono do banco. Sem checagem de admin aqui: quem chama
// (admin-actions.ts) já passou pelo requireAdmin. Separado para os testes de banco chamarem direto.
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { noticeEndsAt, type NoticeInput } from "./rules";

/** Grava a resposta e marca como lidas as mensagens do salão (quem responde leu). */
export async function insertAdminReply(tenantId: string, userId: string, body: string): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    const [t] = await tx.execute<{ id: string }>(sql`select id from tenants where id = ${tenantId}`);
    if (!t) return false;
    await tx.execute(
      sql`insert into support_messages (tenant_id, author, user_id, body) values (${tenantId}, 'admin', ${userId}, ${body})`,
    );
    await tx.execute(
      sql`update support_messages set read_at = now() where tenant_id = ${tenantId} and author = 'salon' and read_at is null`,
    );
    return true;
  });
}

export async function markSalonMessagesRead(tenantId: string): Promise<void> {
  await getDb().execute(
    sql`update support_messages set read_at = now() where tenant_id = ${tenantId} and author = 'salon' and read_at is null`,
  );
}

export async function insertNotice(input: NoticeInput, userId: string, now = new Date()): Promise<string> {
  const ends = noticeEndsAt(input.days, now);
  const [r] = await getDb().execute<{ id: string }>(sql`
    insert into platform_notices (title, body, tone, ends_at, created_by)
    values (${input.title}, ${input.body}, ${input.tone}, ${ends ? ends.toISOString() : null}, ${userId})
    returning id`);
  return r!.id;
}

/** Desfazer o "Encerrar": volta ao ar (só se foi encerrado há pouco, para não ressuscitar aviso antigo). */
export async function reopenNotice(id: string): Promise<boolean> {
  const r = await getDb().execute<{ id: string }>(
    sql`update platform_notices set ended_at = null
        where id = ${id} and ended_at > now() - interval '10 minutes' returning id`,
  );
  return r.length > 0;
}

export async function endNotice(id: string): Promise<boolean> {
  const r = await getDb().execute<{ id: string }>(
    sql`update platform_notices set ended_at = now() where id = ${id} and ended_at is null returning id`,
  );
  return r.length > 0;
}
