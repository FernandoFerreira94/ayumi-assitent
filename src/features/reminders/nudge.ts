import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { MessagingOfflineError, MessagingRejectedError, sendFailReason } from "@/features/messaging/port";
import { recordMessage } from "@/features/messaging/store";
import { getReminderSettings } from "./core";
import { secondReminderText } from "./text";

import { isQuietHour } from "./quiet";

export { isQuietHour, QUIET_FROM_HOUR, QUIET_UNTIL_HOUR } from "./quiet";

type Due = {
  id: string;
  tenantId: string;
  clientId: string;
  client: string;
  phone: string;
  service: string;
  startsAt: Date;
  priceCents: number;
};

/**
 * Reserva os agendamentos que ainda não responderam ao lembrete e começam em até `hours` (o 2º aviso da dona).
 * Só entra quem recebeu o lembrete há mais de 2 h e com folga até o horário (se o lembrete saiu
 * perto demais do atendimento, não há reforço). Nunca cancela nada.
 */
export async function claimNudges(tx: Tx, now: Date, hours: number): Promise<Due[]> {
  const iso = now.toISOString();
  const until = new Date(now.getTime() + hours * 3600_000).toISOString();
  const rows = await tx.execute<{
    id: string;
    tenant_id: string;
    client_id: string;
    client: string;
    phone: string;
    service: string;
    starts_at: Date;
    price_cents: number;
  }>(sql`
    with claimed as (
      update appointments set nudge_sent_at = ${iso}
      where id in (
        select id from appointments
        where nudge_sent_at is null and reply_at is null and cancel_asked_at is null
          and status = 'pending_confirmation'
          and reminder_sent_at is not null
          and reminder_sent_at <= ${iso}::timestamptz - interval '2 hours'
          and reminder_sent_at <= starts_at - make_interval(hours => ${hours})
          and starts_at > ${iso} and starts_at <= ${until}
        for update skip locked)
      returning id, tenant_id, client_id, starts_at, service_id, price_cents)
    select c.id, c.tenant_id, c.client_id, c.starts_at, c.price_cents, cl.name as client, cl.phone_e164 as phone,
      s.name as service
    from claimed c join clients cl on cl.id = c.client_id join services s on s.id = c.service_id
    order by c.starts_at`);
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    clientId: r.client_id,
    client: r.client,
    phone: r.phone,
    service: r.service,
    startsAt: new Date(r.starts_at),
    priceCents: Number(r.price_cents),
  }));
}

const release = (tx: Tx, ids: string[]) =>
  ids.length
    ? tx.execute(
        sql`update appointments set nudge_sent_at = null where id in (${sql.join(
          ids.map((i) => sql`${i}`),
          sql`, `,
        )})`,
      )
    : Promise.resolve();

export type NudgeRun = { sent: number; failed: number; offline: boolean };

/** 2º aviso de um estúdio (só se a dona ligou). Quem falhar volta para a fila; fora do horário não envia. */
export async function sendNudges(tx: Tx, port: MessagingPort, now: Date): Promise<NudgeRun> {
  if (isQuietHour(now)) return { sent: 0, failed: 0, offline: false };
  const { secondHours } = await getReminderSettings(tx);
  if (secondHours === null) return { sent: 0, failed: 0, offline: false };
  const due = await claimNudges(tx, now, secondHours);
  if (due.length === 0) return { sent: 0, failed: 0, offline: false };
  // RLS: na transação do estúdio só a linha dele aparece
  const [salon] = await tx
    .select({ name: tenants.name, template: tenants.secondReminderTemplate, fullName: tenants.clientNameFull })
    .from(tenants);
  const failedIds: string[] = [];
  let sent = 0;
  let rejected = 0;
  let offline = false;
  for (const a of due) {
    if (offline) {
      failedIds.push(a.id);
      continue;
    }
    try {
      const text = secondReminderText(a, now, salon);
      const { id } = await port.sendText(a.phone, text);
      sent++;
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
        .catch((e) => console.error(JSON.stringify({ level: "warn", msg: "nudge_record_failed", err: String(e) })));
    } catch (e) {
      console.error(JSON.stringify({ level: "warn", msg: "nudge_send_failed", appointment: a.id, reason: sendFailReason(e) }));
      // Recusado (número sem WhatsApp): fica marcado como tentado e não volta para a fila, senão repete a cada 5 min
      if (e instanceof MessagingRejectedError) rejected++;
      else failedIds.push(a.id);
      if (e instanceof MessagingOfflineError) offline = true;
    }
  }
  await release(tx, failedIds);
  return { sent, failed: failedIds.length + rejected, offline };
}
