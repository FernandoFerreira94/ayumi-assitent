import { eq, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { MessagingOfflineError } from "@/features/messaging/port";
import { recordMessage } from "@/features/messaging/store";
import { reminderText } from "./text";

export { reminderText } from "./text";

export const DEFAULT_REMINDER_HOURS = 24;

type Due = {
  id: string;
  tenantId: string;
  clientId: string;
  startsAt: Date;
  client: string;
  phone: string;
  service: string;
};

/**
 * Reserva (de forma atômica) os agendamentos que precisam de lembrete agora.
 * O UPDATE ... SKIP LOCKED garante que dois workers nunca peguem o mesmo agendamento.
 */
export async function claimDue(tx: Tx, now: Date, hours = DEFAULT_REMINDER_HOURS): Promise<Due[]> {
  const until = new Date(now.getTime() + hours * 3600_000);
  const rows = await tx.execute<{
    id: string;
    tenant_id: string;
    client_id: string;
    starts_at: Date;
    client: string;
    phone: string;
    service: string;
  }>(sql`
    with claimed as (
      update appointments set reminder_sent_at = ${now.toISOString()}
      where id in (
        select id from appointments
        where reminder_sent_at is null
          and status in ('pending_confirmation','confirmed')
          and starts_at > ${now.toISOString()} and starts_at <= ${until.toISOString()}
        for update skip locked)
      returning id, tenant_id, starts_at, client_id, service_id)
    select c.id, c.tenant_id, c.client_id, c.starts_at, cl.name as client, cl.phone_e164 as phone, s.name as service
    from claimed c join clients cl on cl.id = c.client_id join services s on s.id = c.service_id
    order by c.starts_at`);
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    clientId: r.client_id,
    startsAt: new Date(r.starts_at),
    client: r.client,
    phone: r.phone,
    service: r.service,
  }));
}

export const release = (tx: Tx, ids: string[]) =>
  ids.length
    ? tx.execute(
        sql`update appointments set reminder_sent_at = null where id in (${sql.join(
          ids.map((i) => sql`${i}`),
          sql`, `,
        )})`,
      )
    : Promise.resolve();

export type ReminderRun = { sent: number; failed: number; offline: boolean };

/**
 * Envia os lembretes de um estúdio. Quem falhar volta para a fila (reminder_sent_at = null)
 * e será tentado na próxima rodada; se o WhatsApp estiver offline, para na hora.
 */
export async function sendReminders(tx: Tx, port: MessagingPort, now: Date): Promise<ReminderRun> {
  const due = await claimDue(tx, now, await getReminderHours(tx));
  if (due.length === 0) return { sent: 0, failed: 0, offline: false };
  // RLS: na transação do estúdio só a linha dele aparece
  const [salon] = await tx.select({ name: tenants.name, template: tenants.reminderTemplate }).from(tenants);
  const failedIds: string[] = [];
  let sent = 0;
  let offline = false;
  for (const a of due) {
    if (offline) {
      failedIds.push(a.id);
      continue;
    }
    try {
      const text = reminderText(a, now, salon);
      const { id } = await port.sendText(a.phone, text);
      sent++;
      // Entra na conversa da cliente. Num savepoint e fora do catch de envio: se gravar falhar,
      // a mensagem já saiu e não pode voltar para a fila (a cliente receberia duas vezes)
      await tx
        .transaction((sp) =>
          recordMessage(sp, a.tenantId, {
            clientId: a.clientId,
            appointmentId: a.id,
            direction: "out",
            kind: "reminder",
            body: text,
            externalId: id,
            createdAt: now,
          }),
        )
        .catch((e) => console.error(JSON.stringify({ level: "warn", msg: "reminder_record_failed", err: String(e) })));
    } catch (e) {
      failedIds.push(a.id);
      if (e instanceof MessagingOfflineError) offline = true;
    }
  }
  await release(tx, failedIds);
  return { sent, failed: failedIds.length, offline };
}

export const getReminderHours = async (tx: Tx) =>
  (await tx.select({ hours: tenants.reminderHours }).from(tenants))[0]?.hours ?? DEFAULT_REMINDER_HOURS;

export const saveReminderHours = (tx: Tx, tenantId: string, hours: number) =>
  tx.update(tenants).set({ reminderHours: hours }).where(eq(tenants.id, tenantId));
