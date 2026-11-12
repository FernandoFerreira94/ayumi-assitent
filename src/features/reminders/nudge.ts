import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { MessagingOfflineError } from "@/features/messaging/port";
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
  /** Já confirmou: o 2º aviso vai só como lembrete, sem as opções 1/2/3 */
  confirmed: boolean;
};

/**
 * Reserva os agendamentos que começam em até `hours` (o 2º aviso da dona): os confirmados (só lembrete) e os
 * que ainda esperam confirmação sem resposta. Com o 1º aviso ligado, só entra quem o recebeu há mais de 2 h e
 * com folga até o horário (lembrete perto demais do atendimento = sem reforço). Com o 1º aviso desligado,
 * entra quem foi agendado antes da janela do 2º (agendou em cima da hora = já recebeu a confirmação).
 * Nunca cancela nada.
 */
export async function claimNudges(tx: Tx, now: Date, hours: number, firstOn = true): Promise<Due[]> {
  const iso = now.toISOString();
  const until = new Date(now.getTime() + hours * 3600_000).toISOString();
  const firstOff = !firstOn;
  const rows = await tx.execute<{
    id: string;
    tenant_id: string;
    client_id: string;
    client: string;
    phone: string;
    service: string;
    starts_at: Date;
    price_cents: number;
    confirmed: boolean;
  }>(sql`
    with claimed as (
      update appointments set nudge_sent_at = ${iso}
      where id in (
        select id from appointments
        where nudge_sent_at is null and cancel_asked_at is null
          and (status = 'confirmed' or (status = 'pending_confirmation' and reply_at is null))
          and (
            (reminder_sent_at is not null
              and reminder_sent_at <= ${iso}::timestamptz - interval '2 hours'
              and reminder_sent_at <= starts_at - make_interval(hours => ${hours}))
            or (${firstOff} and reminder_sent_at is null
              and created_at <= starts_at - make_interval(hours => ${hours}))
          )
          and starts_at > ${iso} and starts_at <= ${until}
        for update skip locked)
      returning id, tenant_id, client_id, starts_at, service_id, price_cents, status)
    select c.id, c.tenant_id, c.client_id, c.starts_at, c.price_cents, cl.name as client, cl.phone_e164 as phone,
      s.name as service, c.status = 'confirmed' as confirmed
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
    confirmed: r.confirmed === true,
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
  const { first, secondHours } = await getReminderSettings(tx);
  if (secondHours === null) return { sent: 0, failed: 0, offline: false };
  const due = await claimNudges(tx, now, secondHours, first);
  if (due.length === 0) return { sent: 0, failed: 0, offline: false };
  // RLS: na transação do estúdio só a linha dele aparece
  const [salon] = await tx
    .select({ name: tenants.name, template: tenants.secondReminderTemplate, fullName: tenants.clientNameFull })
    .from(tenants);
  const failedIds: string[] = [];
  let sent = 0;
  let offline = false;
  for (const a of due) {
    if (offline) {
      failedIds.push(a.id);
      continue;
    }
    try {
      const text = secondReminderText(a, now, salon, a.confirmed);
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
      failedIds.push(a.id);
      if (e instanceof MessagingOfflineError) offline = true;
    }
  }
  await release(tx, failedIds);
  return { sent, failed: failedIds.length, offline };
}
