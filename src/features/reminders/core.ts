import { eq, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { MessagingOfflineError, MessagingRejectedError, sendFailReason } from "@/features/messaging/port";
import { recordMessage } from "@/features/messaging/store";
import { isQuietHour } from "./quiet";
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
  /** Valor do atendimento, para a chave {valor} */
  priceCents: number;
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
    price_cents: number;
  }>(sql`
    with claimed as (
      update appointments set reminder_sent_at = ${now.toISOString()}
      where id in (
        select id from appointments
        where reminder_sent_at is null
          and status in ('pending_confirmation','confirmed')
          and starts_at > ${now.toISOString()} and starts_at <= ${until.toISOString()}
        for update skip locked)
      returning id, tenant_id, starts_at, client_id, service_id, price_cents)
    select c.id, c.tenant_id, c.client_id, c.starts_at, c.price_cents, cl.name as client, cl.phone_e164 as phone, s.name as service
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
    priceCents: Number(r.price_cents),
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
  // De 21h às 6h nada sai; o que venceu nesse intervalo sai na primeira rodada das 6h
  if (isQuietHour(now)) return { sent: 0, failed: 0, offline: false };
  if (!(await getReminderSettings(tx)).first) return { sent: 0, failed: 0, offline: false };
  const due = await claimDue(tx, now, await getReminderHours(tx));
  if (due.length === 0) return { sent: 0, failed: 0, offline: false };
  // RLS: na transação do estúdio só a linha dele aparece
  const [salon] = await tx
    .select({ name: tenants.name, template: tenants.reminderTemplate, fullName: tenants.clientNameFull })
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
      console.error(JSON.stringify({ level: "warn", msg: "reminder_send_failed", appointment: a.id, reason: sendFailReason(e) }));
      // Recusado (número sem WhatsApp): fica marcado como tentado e não volta para a fila, senão repete a cada 5 min
      if (e instanceof MessagingRejectedError) rejected++;
      else failedIds.push(a.id);
      if (e instanceof MessagingOfflineError) offline = true;
    }
  }
  await release(tx, failedIds);
  return { sent, failed: failedIds.length + rejected, offline };
}

export const getReminderHours = async (tx: Tx) =>
  (await tx.select({ hours: tenants.reminderHours }).from(tenants))[0]?.hours ?? DEFAULT_REMINDER_HOURS;

/** 1º aviso (ligado ou não, horas antes) e 2º aviso opcional (null = desligado). */
export type ReminderSettings = { first: boolean; hours: number; secondHours: number | null };

export async function getReminderSettings(tx: Tx): Promise<ReminderSettings> {
  const [row] = await tx
    .select({ first: tenants.firstReminder, hours: tenants.reminderHours, second: tenants.secondReminderHours })
    .from(tenants);
  return { first: row?.first ?? true, hours: row?.hours ?? DEFAULT_REMINDER_HOURS, secondHours: row?.second ?? null };
}

/** Tudo do cartão "Mensagens no WhatsApp" de Ajustes: avisos, os três textos e como chamar a cliente. */
export type MessageSettings = ReminderSettings & {
  fullName: boolean;
  bookingTemplate: string | null;
  reminderTemplate: string | null;
  secondTemplate: string | null;
};

export async function getMessageSettings(tx: Tx): Promise<MessageSettings> {
  const [row] = await tx
    .select({
      first: tenants.firstReminder,
      hours: tenants.reminderHours,
      second: tenants.secondReminderHours,
      fullName: tenants.clientNameFull,
      booking: tenants.bookingTemplate,
      reminder: tenants.reminderTemplate,
      secondTemplate: tenants.secondReminderTemplate,
    })
    .from(tenants);
  return {
    first: row?.first ?? true,
    hours: row?.hours ?? DEFAULT_REMINDER_HOURS,
    secondHours: row?.second ?? null,
    fullName: row?.fullName ?? false,
    bookingTemplate: row?.booking ?? null,
    reminderTemplate: row?.reminder ?? null,
    secondTemplate: row?.secondTemplate ?? null,
  };
}

export const saveMessageSettings = (tx: Tx, tenantId: string, s: MessageSettings) =>
  tx
    .update(tenants)
    .set({
      firstReminder: s.first,
      reminderHours: s.hours,
      secondReminderHours: s.secondHours,
      clientNameFull: s.fullName,
      bookingTemplate: s.bookingTemplate,
      reminderTemplate: s.reminderTemplate,
      secondReminderTemplate: s.secondTemplate,
    })
    .where(eq(tenants.id, tenantId));
