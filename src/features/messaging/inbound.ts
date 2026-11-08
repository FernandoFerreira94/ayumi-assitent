import "server-only";
import { and, asc, eq, gt, inArray, isNotNull, isNull } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { appointments, clients, messages, tenants } from "@/db/schema";
import { sendToAll } from "@/features/push/core";
import type { PushPort } from "@/features/push/port";
import type { MessagingPort } from "./port";
import { ackText, parseIntent, phoneCandidates, type InboundText, type Intent } from "./replies";
import { recordMessage } from "./store";

const STATUS_FOR: Record<Intent, "confirmed" | "cancelled" | "reschedule_requested"> = {
  confirm: "confirmed",
  cancel: "cancelled",
  reschedule: "reschedule_requested",
};

const pushTitle = (name: string, intent: Intent | null) => {
  const first = name.trim().split(/\s+/)[0];
  if (intent === "confirm") return `${first} confirmou o horário`;
  if (intent === "cancel") return `${first} cancelou o horário`;
  if (intent === "reschedule") return `${first} quer remarcar`;
  return `${first} mandou mensagem`;
};

export type InboundDeps = {
  portFor: (instance: string) => MessagingPort | null;
  push: PushPort | null;
  /** Leva o cancelamento ao Google Agenda; não pode lançar. */
  syncAppointment: (tenantId: string, appointmentId: string) => Promise<unknown>;
  now?: Date;
};

export type InboundResult =
  | { handled: false; reason: "tenant" | "client" | "duplicate" }
  | { handled: true; intent: Intent | null; appointmentId: string | null };

/**
 * Uma mensagem chegou pelo webhook. Liga ao estúdio (pela instância) e à cliente (pelo telefone),
 * guarda na conversa e, se havia lembrete esperando resposta, entende 1/2/3, atualiza o
 * agendamento, agradece à cliente e avisa a dona. Webhook repetido não faz nada duas vezes.
 */
export async function handleInbound(msg: InboundText, deps: InboundDeps): Promise<InboundResult> {
  const now = deps.now ?? new Date();
  const [t] = await getDb().select({ id: tenants.id }).from(tenants).where(eq(tenants.whatsappInstance, msg.instance));
  if (!t) return { handled: false, reason: "tenant" };
  const tenantId = t.id;

  const step = await withTenant(tenantId, async (tx) => {
    const found = await tx
      .select({ id: clients.id, name: clients.name, phone: clients.phoneE164 })
      .from(clients)
      .where(inArray(clients.phoneE164, phoneCandidates(msg.phoneDigits)))
      .limit(1);
    const cli = found[0];
    // Número que não é cliente: não guarda nada (é conversa particular da dona)
    if (!cli) return { kind: "skip", reason: "client" } as const;

    if (msg.fromMe) {
      // Eco do que o app mandou (mesmo id: some no conflito) ou a dona escrevendo pelo celular
      const id = await recordMessage(tx, tenantId, { clientId: cli.id, direction: "out", kind: "phone", body: msg.text, externalId: msg.externalId });
      return id ? ({ kind: "done", intent: null, appointmentId: null } as const) : ({ kind: "skip", reason: "duplicate" } as const);
    }

    const messageId = await recordMessage(tx, tenantId, { clientId: cli.id, direction: "in", kind: "client", body: msg.text, externalId: msg.externalId });
    if (!messageId) return { kind: "skip", reason: "duplicate" } as const;

    // Só vale como resposta se o lembrete do próximo horário ainda espera resposta
    const [open] = await tx
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.clientId, cli.id),
          isNotNull(appointments.reminderSentAt),
          isNull(appointments.replyAt),
          inArray(appointments.status, ["pending_confirmation", "confirmed"]),
          gt(appointments.startsAt, now),
        ),
      )
      .orderBy(asc(appointments.startsAt))
      .limit(1);
    const intent = open ? parseIntent(msg.text) : null;
    if (open && intent) {
      await tx.update(appointments).set({ status: STATUS_FOR[intent], replyAt: now }).where(eq(appointments.id, open.id));
      await tx.update(messages).set({ intent, appointmentId: open.id }).where(eq(messages.id, messageId));
    }
    return { kind: "reply", client: cli, intent: open && intent ? intent : null, appointmentId: open && intent ? open.id : null } as const;
  });

  if (step.kind === "skip") return { handled: false, reason: step.reason };
  if (step.kind === "done") return { handled: true, intent: null, appointmentId: null };

  // Fora da transação: envio e push vão para a rede e não devem segurar o banco
  const { client, intent, appointmentId } = step;
  if (intent && appointmentId) {
    if (intent === "cancel") await deps.syncAppointment(tenantId, appointmentId);
    const port = deps.portFor(msg.instance);
    const body = ackText(intent, client.name);
    try {
      const sent = port ? await port.sendText(client.phone, body) : null;
      if (sent) await withTenant(tenantId, (tx) => recordMessage(tx, tenantId, { clientId: client.id, appointmentId, direction: "out", kind: "auto_reply", body, externalId: sent.id }));
    } catch (e) {
      // O status já mudou; sem o agradecimento a cliente só não recebe o "obrigada"
      console.error(JSON.stringify({ level: "warn", msg: "auto_reply_failed", err: String(e) }));
    }
  }
  if (deps.push) {
    const push = deps.push;
    await withTenant(tenantId, (tx) =>
      sendToAll(tx, push, { title: pushTitle(client.name, intent), body: msg.text.slice(0, 140), url: "/agenda" }),
    ).catch((e) => console.error(JSON.stringify({ level: "warn", msg: "reply_push_failed", err: String(e) })));
  }
  return { handled: true, intent, appointmentId };
}
