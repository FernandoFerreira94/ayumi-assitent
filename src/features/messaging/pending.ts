import { sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { isQuietHour } from "@/features/reminders/quiet";
import { MessagingOfflineError, MessagingRejectedError, sendFailReason, type MessagingPort } from "./port";
import { recordMessage } from "./store";

export type PendingRun = { sent: number; failed: number; offline: boolean };

/**
 * Respostas automáticas guardadas porque a cliente escreveu entre 21h e 6h (inbound.ts). Saem na primeira
 * rodada fora desse horário. O UPDATE ... SKIP LOCKED reserva cada uma para um worker só; quem falhar volta.
 */
export async function sendPendingReplies(tx: Tx, port: MessagingPort, now: Date): Promise<PendingRun> {
  if (isQuietHour(now)) return { sent: 0, failed: 0, offline: false };
  const due = await tx.execute<{ id: string; tenant_id: string; client_id: string; body: string; phone: string }>(sql`
    with claimed as (
      update appointments a set pending_reply = null
      from (select id, pending_reply from appointments where pending_reply is not null for update skip locked) p
      where a.id = p.id
      returning a.id, a.tenant_id, a.client_id, p.pending_reply as body)
    select c.id, c.tenant_id, c.client_id, c.body, cl.phone_e164 as phone
    from claimed c join clients cl on cl.id = c.client_id`);
  const run: PendingRun = { sent: 0, failed: 0, offline: false };
  for (const r of due) {
    if (run.offline) {
      await restore(tx, r.id, r.body);
      run.failed++;
      continue;
    }
    try {
      const { id } = await port.sendText(r.phone, r.body);
      run.sent++;
      await tx
        .transaction((sp) =>
          recordMessage(sp, r.tenant_id, {
            clientId: r.client_id,
            appointmentId: r.id,
            direction: "out",
            kind: "auto_reply",
            body: r.body,
            externalId: id,
            createdAt: now,
          }),
        )
        .catch((e) => console.error(JSON.stringify({ level: "warn", msg: "pending_record_failed", err: String(e) })));
    } catch (e) {
      console.error(JSON.stringify({ level: "warn", msg: "pending_send_failed", appointment: r.id, reason: sendFailReason(e) }));
      // Recusado (número sem WhatsApp): descarta, senão repete a cada 5 min
      if (!(e instanceof MessagingRejectedError)) await restore(tx, r.id, r.body);
      run.failed++;
      if (e instanceof MessagingOfflineError) run.offline = true;
    }
  }
  return run;
}

const restore = (tx: Tx, id: string, body: string) =>
  tx.execute(sql`update appointments set pending_reply = ${body} where id = ${id} and pending_reply is null`);
