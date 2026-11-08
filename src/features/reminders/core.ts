import { sql } from "drizzle-orm";
import { tenants } from "@/db/schema";
import type { Tx } from "@/db/client";
import { addDays, formatTime, todayStr } from "@/lib/dates";
import { DEFAULT_REMINDER, fillTemplate } from "@/features/profile/templates";
import type { MessagingPort } from "@/features/messaging/port";
import { MessagingOfflineError } from "@/features/messaging/port";

export const REMINDER_WINDOW_HOURS = 24;

type Due = { id: string; startsAt: Date; client: string; phone: string; service: string };

/** "hoje", "amanhã" ou a data, no fuso do estúdio. */
function dayWord(startsAt: Date, now: Date): string {
  const day = todayStr(startsAt);
  const today = todayStr(now);
  if (day === today) return "hoje";
  if (day === addDays(today, 1)) return "amanhã";
  return `dia ${day.slice(8)}/${day.slice(5, 7)}`;
}

export function reminderText(
  a: Pick<Due, "client" | "service" | "startsAt">,
  now: Date,
  template: string | null = null,
  studio = "",
): string {
  const first = a.client.trim().split(/\s+/)[0];
  return fillTemplate(template || DEFAULT_REMINDER, {
    nome: first,
    servico: a.service,
    dia: dayWord(a.startsAt, now),
    hora: formatTime(a.startsAt),
    studio,
  });
}

/**
 * Reserva (de forma atômica) os agendamentos que precisam de lembrete agora.
 * O UPDATE ... SKIP LOCKED garante que dois workers nunca peguem o mesmo agendamento.
 */
export async function claimDue(tx: Tx, now: Date): Promise<Due[]> {
  const until = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 3600_000);
  const rows = await tx.execute<{ id: string; starts_at: Date; client: string; phone: string; service: string }>(sql`
    with claimed as (
      update appointments set reminder_sent_at = ${now.toISOString()}
      where id in (
        select id from appointments
        where reminder_sent_at is null
          and status in ('pending_confirmation','confirmed')
          and starts_at > ${now.toISOString()} and starts_at <= ${until.toISOString()}
        for update skip locked)
      returning id, starts_at, client_id, service_id)
    select c.id, c.starts_at, cl.name as client, cl.phone_e164 as phone, s.name as service
    from claimed c join clients cl on cl.id = c.client_id join services s on s.id = c.service_id
    order by c.starts_at`);
  return rows.map((r) => ({
    id: r.id,
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
  const due = await claimDue(tx, now);
  const [studio] = due.length ? await tx.select({ name: tenants.name, msg: tenants.msgReminder }).from(tenants) : [];
  const failedIds: string[] = [];
  let sent = 0;
  let offline = false;
  for (const a of due) {
    if (offline) {
      failedIds.push(a.id);
      continue;
    }
    try {
      await port.sendText(a.phone, reminderText(a, now, studio?.msg ?? null, studio?.name ?? ""));
      sent++;
    } catch (e) {
      failedIds.push(a.id);
      if (e instanceof MessagingOfflineError) offline = true;
    }
  }
  await release(tx, failedIds);
  return { sent, failed: failedIds.length, offline };
}
