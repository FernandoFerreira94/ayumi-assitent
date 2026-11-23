import { eq, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { sessionUseSql } from "@/features/wallet/packages";
import { parseSessionUse, type SessionUse } from "@/features/wallet/session-use";
import { tenants } from "@/db/schema";
import type { MessagingPort } from "@/features/messaging/port";
import { MessagingOfflineError, MessagingRejectedError, sendFailReason } from "@/features/messaging/port";
import { recordMessage } from "@/features/messaging/store";
import { isQuietHour } from "./quiet";
import { reminderText } from "./text";
import { errCode } from "@/lib/log";

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
  /** Sessão de pacote deste horário ("3 de 6"); null = não usa pacote */
  session: SessionUse | null;
};

/** 1º aviso só até 2 h antes do horário. */
export const FIRST_MIN_LEAD_HOURS = 2;

/**
 * Reserva (de forma atômica) os agendamentos que precisam de lembrete agora.
 * O UPDATE ... SKIP LOCKED garante que dois workers nunca peguem o mesmo agendamento.
 */
export async function claimDue(tx: Tx, now: Date, hours = DEFAULT_REMINDER_HOURS): Promise<Due[]> {
  const until = new Date(now.getTime() + hours * 3600_000);
  // Em cima da hora (WhatsApp reconectado, rodada atrasada) não pede 1/2/3: a confirmação do agendamento já foi
  const from = new Date(now.getTime() + FIRST_MIN_LEAD_HOURS * 3600_000);
  const rows = await tx.execute<{
    id: string;
    tenant_id: string;
    client_id: string;
    starts_at: Date;
    client: string;
    phone: string;
    service: string;
    price_cents: number;
    session: unknown;
  }>(sql`
    with claimed as (
      update appointments set reminder_sent_at = ${now.toISOString()}
      where id in (
        select id from appointments
        where reminder_sent_at is null
          and status in ('pending_confirmation','confirmed')
          and starts_at > ${from.toISOString()} and starts_at <= ${until.toISOString()}
          and client_id not in (select id from clients where opted_out_at is not null)
        for update skip locked)
      returning id, tenant_id, starts_at, client_id, service_id, price_cents, client_package_id)
    select c.id, c.tenant_id, c.client_id, c.starts_at, c.price_cents,
      ${sessionUseSql(sql`c.id`, sql`c.client_package_id`, sql`c.starts_at`)} as session, cl.name as client, cl.phone_e164 as phone, s.name as service
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
    session: parseSessionUse(r.session),
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
    .select({
      name: tenants.name,
      template: tenants.reminderTemplate,
      fullName: tenants.clientNameFull,
      address: tenants.address,
      packageLine: tenants.packageLine,
    })
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
      const text = reminderText({ ...a, session: salon?.packageLine ? a.session : null }, now, salon);
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
        .catch((e) => console.error(JSON.stringify({ level: "warn", msg: "reminder_record_failed", ...errCode(e) })));
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
  /** Aviso à cliente quando a dona remarca (ligado por padrão) e o texto dele (null = padrão) */
  rescheduleOn: boolean;
  rescheduleTemplate: string | null;
  /** Linha "Sessão 3 de 6 do seu pacote" na confirmação e nos avisos (ligada por padrão) */
  packageLine: boolean;
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
      rescheduleOn: tenants.rescheduleNotice,
      rescheduleTemplate: tenants.rescheduleTemplate,
      packageLine: tenants.packageLine,
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
    rescheduleOn: row?.rescheduleOn ?? true,
    rescheduleTemplate: row?.rescheduleTemplate ?? null,
    packageLine: row?.packageLine ?? true,
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
      rescheduleNotice: s.rescheduleOn,
      rescheduleTemplate: s.rescheduleTemplate,
      packageLine: s.packageLine,
    })
    .where(eq(tenants.id, tenantId));
