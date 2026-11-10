import { and, eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { pushSubscriptions } from "@/db/schema";
import { countPendencias, listPendencias } from "@/features/appointments/pendencias";
import { PushGoneError, type PushPayload, type PushPort, type PushSub } from "./port";

export async function saveSubscription(tx: Tx, tenantId: string, userId: string, sub: PushSub) {
  await tx
    .insert(pushSubscriptions)
    .values({ tenantId, userId, ...sub })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { tenantId, userId, p256dh: sub.p256dh, auth: sub.auth },
    });
}

export async function removeSubscription(tx: Tx, userId: string, endpoint: string) {
  await tx
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
}

export async function hasSubscription(tx: Tx, userId: string): Promise<boolean> {
  const r = await tx
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .limit(1);
  return r.length > 0;
}

export function pendenciasText(n: number): string {
  return n === 1 ? "Você tem 1 pendência na agenda." : `Você tem ${n} pendências na agenda.`;
}

export type PushRun = { sent: number; removed: number; failed: number };

/** Avisa o estúdio se houver pendências. Inscrições mortas são apagadas; falhas não propagam. */
export async function notifyPendencias(tx: Tx, port: PushPort, now: Date, googleConnected: boolean): Promise<PushRun> {
  const n = countPendencias(await listPendencias(tx, now, googleConnected));
  if (n === 0) return { sent: 0, removed: 0, failed: 0 };
  return sendToAll(tx, port, { title: "mimo", body: pendenciasText(n), url: "/pendencias" });
}

/** Manda o aviso para todos os aparelhos inscritos do estúdio (o da transação); com função, o texto varia por pessoa. */
export async function sendToAll(
  tx: Tx,
  port: PushPort,
  payload: PushPayload | ((sub: { userId: string }) => PushPayload),
): Promise<PushRun> {
  const run: PushRun = { sent: 0, removed: 0, failed: 0 };
  const subs = await tx.select().from(pushSubscriptions);
  for (const s of subs) {
    try {
      await port.send(s, typeof payload === "function" ? payload(s) : payload);
      run.sent++;
    } catch (e) {
      if (e instanceof PushGoneError) {
        await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
        run.removed++;
      } else run.failed++;
    }
  }
  return run;
}
