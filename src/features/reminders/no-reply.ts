import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { sendToAll } from "@/features/push/core";
import type { PushPort } from "@/features/push/port";
import { formatTime } from "@/lib/dates";
import { isQuietHour } from "./nudge";

/** Depois do 2º aviso, quanto esperar a resposta antes de avisar a dona. */
export const AFTER_SECOND_MIN = 60;
/** Sem 2º aviso, quanto esperar depois do 1º. */
export const AFTER_FIRST_MIN = 120;

export type NoReply = { id: string; clientId: string; client: string; startsAt: Date };

/**
 * Marca (uma vez por agendamento) quem não respondeu aos avisos: passou o tempo depois do último aviso que
 * ia sair, ou falta menos de 1 h para o horário. Só quem ainda espera confirmação e tem o 1º aviso enviado.
 */
export async function claimNoReplies(tx: Tx, now: Date, secondHours: number | null): Promise<NoReply[]> {
  const iso = now.toISOString();
  const secondOff = secondHours === null;
  const rows = await tx.execute<{ id: string; client_id: string; client: string; starts_at: Date }>(sql`
    with claimed as (
      update appointments set no_reply_at = ${iso}
      where id in (
        select id from appointments
        where no_reply_at is null and reply_at is null and cancel_asked_at is null
          and status = 'pending_confirmation'
          and reminder_sent_at is not null
          and starts_at > ${iso}
          and (
            (nudge_sent_at is not null and nudge_sent_at <= ${iso}::timestamptz - make_interval(mins => ${AFTER_SECOND_MIN}))
            or (${secondOff} and reminder_sent_at <= ${iso}::timestamptz - make_interval(mins => ${AFTER_FIRST_MIN}))
            or (starts_at <= ${iso}::timestamptz + interval '1 hour' and reminder_sent_at <= ${iso}::timestamptz - interval '30 minutes')
          )
        for update skip locked)
      returning id, client_id, starts_at)
    select c.id, c.client_id, c.starts_at, cl.name as client
    from claimed c join clients cl on cl.id = c.client_id
    order by c.starts_at`);
  return rows.map((r) => ({ id: r.id, clientId: r.client_id, client: r.client, startsAt: new Date(r.starts_at) }));
}

/** Avisa a dona no celular, uma notificação por cliente; tocar abre a conversa. Fora do horário, espera a manhã. */
export async function notifyNoReplies(tx: Tx, push: PushPort, now: Date, secondHours: number | null): Promise<number> {
  if (isQuietHour(now)) return 0;
  const due = await claimNoReplies(tx, now, secondHours);
  for (const a of due) {
    const first = a.client.trim().split(/\s+/)[0];
    await sendToAll(tx, push, {
      title: `${first} não respondeu`,
      body: `Ainda não confirmou o horário das ${formatTime(a.startsAt)}. Toque para ver a conversa.`,
      url: `/agenda?conversa=${a.clientId}`,
    });
  }
  return due.length;
}

/** Para o sino: quem não respondeu e ainda pode confirmar (horário no futuro, sem resposta). */
export async function listNoReplies(
  tx: Tx,
  now: Date,
): Promise<{ id: string; clientId: string; clientName: string; time: string }[]> {
  const rows = await tx.execute<{ id: string; client_id: string; client: string; starts_at: Date }>(sql`
    select a.id, a.client_id, a.starts_at, cl.name as client
    from appointments a join clients cl on cl.id = a.client_id
    where a.no_reply_at is not null and a.reply_at is null and a.status = 'pending_confirmation'
      and a.starts_at > ${now.toISOString()}
    order by a.starts_at`);
  return rows.map((r) => ({
    id: r.id,
    clientId: r.client_id,
    clientName: r.client,
    time: formatTime(new Date(r.starts_at)),
  }));
}
