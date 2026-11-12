import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { appointments, clients, messages, tenants } from "@/db/schema";
import { sendToAll } from "@/features/push/core";
import type { PushPort } from "@/features/push/port";
import {
  CORRECTION_HOURS,
  OWNER_QUIET_HOURS,
  planAiReply,
  type AiPlan,
  type AiVerdict,
} from "./ai-policy";
import type { MessagingPort } from "./port";
import { isQuietHour } from "@/features/reminders/quiet";
import { clientCall, slotLabel } from "@/features/reminders/text";
import { ackText, parseIntent, phoneCandidates, type InboundText, type Intent } from "./replies";
import { recordMessage } from "./store";

/**
 * Cancelar e remarcar não mexem no horário sozinhos: os dois viram "quer remarcar" e a profissional
 * decide o melhor horário com a cliente pela conversa.
 */
const STATUS_FOR: Record<Intent, "confirmed" | "reschedule_requested"> = {
  confirm: "confirmed",
  cancel: "reschedule_requested",
  reschedule: "reschedule_requested",
};

const GUESS_LABEL: Record<Intent, string> = {
  confirm: "confirmar",
  cancel: "cancelar",
  reschedule: "remarcar",
};

const firstName = (name: string) => name.trim().split(/\s+/)[0];

/**
 * Notificação no celular da dona. Só para o que ela pediu: confirmou, quer cancelar, quer remarcar (e quando a IA
 * passou a conversa, porque a cliente ouviu que a profissional responde). Mensagem solta não vira notificação.
 */
const pushTitle = (name: string, intent: Intent | null, guess: Intent | null, correction: boolean, handedOff: boolean) => {
  const first = firstName(name);
  if (correction && intent) return `${first} corrigiu a resposta: ${GUESS_LABEL[intent]}`;
  if (intent === "confirm") return `${first} confirmou o horário`;
  if (intent === "cancel") return `${first} quer cancelar`;
  if (intent === "reschedule") return `${first} quer remarcar`;
  if (guess === "cancel" || guess === "reschedule") return `${first} parece querer ${GUESS_LABEL[guess]}`;
  if (handedOff) return `${first} precisa de você na conversa`;
  return null;
};

export type InboundDeps = {
  portFor: (instance: string) => MessagingPort | null;
  push: PushPort | null;
  /** Modelo que entende mensagens que as regras simples não entenderam (opcional; sem ele, só avisa a dona) */
  classify?: (text: string, rules: string | null) => Promise<AiVerdict | null>;
  now?: Date;
};

export type InboundResult =
  | { handled: false; reason: "tenant" | "client" | "duplicate" }
  | { handled: true; intent: Intent | null; appointmentId: string | null };

type Target = { id: string; handedOff: boolean; correction: boolean; status: string; startsAt: Date };

/**
 * Uma mensagem chegou pelo webhook. Liga ao estúdio (pela instância) e à cliente (pelo telefone),
 * guarda na conversa e, se havia lembrete esperando resposta (ou resposta recente que ela pode corrigir),
 * entende a mensagem: primeiro pelas regras simples (1/2/3, "ok"...), depois, com a IA ligada, pelo modelo.
 * O que nenhum dos dois entende vai para a profissional, avisando a cliente uma vez por agendamento.
 * Webhook repetido não faz nada duas vezes.
 */
export async function handleInbound(msg: InboundText, deps: InboundDeps): Promise<InboundResult> {
  const now = deps.now ?? new Date();
  const [t] = await getDb()
    .select({ id: tenants.id, aiEnabled: tenants.aiEnabled, aiRules: tenants.aiRules, fullName: tenants.clientNameFull })
    .from(tenants)
    .where(eq(tenants.whatsappInstance, msg.instance));
  if (!t) return { handled: false, reason: "tenant" };
  const tenantId = t.id;
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

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
      const id = await recordMessage(tx, tenantId, {
        clientId: cli.id,
        direction: "out",
        kind: "phone",
        body: msg.text,
        externalId: msg.externalId,
      });
      return id
        ? ({ kind: "done", intent: null, appointmentId: null } as const)
        : ({ kind: "skip", reason: "duplicate" } as const);
    }

    const messageId = await recordMessage(tx, tenantId, {
      clientId: cli.id,
      direction: "in",
      kind: "client",
      body: msg.text,
      externalId: msg.externalId,
    });
    if (!messageId) return { kind: "skip", reason: "duplicate" } as const;

    // Alvo da mensagem: o lembrete do próximo horário que ainda espera resposta; se não há, a resposta
    // dada há pouco (a cliente pode ter errado o número e corrigir)
    let target: Target | null = null;
    const [open] = await tx
      .select({ id: appointments.id, handoff: appointments.aiHandoffAt, status: appointments.status, startsAt: appointments.startsAt })
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
    if (open)
      target = { id: open.id, handedOff: !!open.handoff, correction: false, status: open.status, startsAt: open.startsAt };
    else {
      const [recent] = await tx
        .select({ id: appointments.id, handoff: appointments.aiHandoffAt, status: appointments.status, startsAt: appointments.startsAt })
        .from(appointments)
        .where(
          and(
            eq(appointments.clientId, cli.id),
            gte(appointments.replyAt, hoursAgo(CORRECTION_HOURS)),
            inArray(appointments.status, ["confirmed", "reschedule_requested"]),
            gt(appointments.startsAt, now),
          ),
        )
        .orderBy(desc(appointments.replyAt))
        .limit(1);
      if (recent)
        target = {
          id: recent.id,
          handedOff: !!recent.handoff,
          correction: true,
          status: recent.status,
          startsAt: recent.startsAt,
        };
    }

    // Regras simples primeiro: de graça e previsíveis
    const ruleIntent = target && !msg.media ? parseIntent(msg.text) : null;

    // Contexto para a IA (só quando as regras não entenderam e a IA está ligada)
    let ai: { ownerWroteRecently: boolean; autoRepliesLast24h: number } | null = null;
    if (target && !ruleIntent && t.aiEnabled) {
      const [{ owner }] = await tx
        .select({ owner: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.clientId, cli.id),
            eq(messages.direction, "out"),
            inArray(messages.kind, ["phone", "manual"]),
            gte(messages.createdAt, hoursAgo(OWNER_QUIET_HOURS)),
          ),
        );
      const [{ auto }] = await tx
        .select({ auto: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.clientId, cli.id),
            eq(messages.direction, "out"),
            eq(messages.kind, "auto_reply"),
            gte(messages.createdAt, hoursAgo(24)),
          ),
        );
      ai = { ownerWroteRecently: owner > 0, autoRepliesLast24h: auto };
    }
    return { kind: "reply", client: cli, messageId, target, ruleIntent, ai } as const;
  });

  if (step.kind === "skip") return { handled: false, reason: step.reason };
  if (step.kind === "done") return { handled: true, intent: null, appointmentId: null };

  const { client, messageId, target, ruleIntent, ai } = step;

  // Decisão. Fora da transação: o modelo vai para a rede e não deve segurar o banco
  let plan: AiPlan;
  if (ruleIntent) plan = { action: "apply", intent: ruleIntent, sendAck: true };
  else if (ai && target && deps.classify) {
    const classify = deps.classify;
    plan = await planAiReply(
      {
        ...ai,
        media: !!msg.media,
        text: msg.text,
        clientName: clientCall(client.name, t.fullName),
        when: slotLabel(target.startsAt, now),
        alreadyHandedOff: target.handedOff,
      },
      () => classify(msg.text, t.aiRules),
    );
  } else plan = { action: "silent", guess: null, quiet: false };

  let intent: Intent | null = null;
  let appointmentId: string | null = null;
  let correction = false;
  let ack: string | null = null;
  let handedOff = false;
  if (target && plan.action === "apply") {
    // Correção que não muda nada (mesmo status) só fica na conversa
    const changes = !target.correction || STATUS_FOR[plan.intent] !== target.status;
    if (changes) {
      intent = plan.intent;
      appointmentId = target.id;
      correction = target.correction;
      if (plan.sendAck) ack = ackText(plan.intent, client.name, t.fullName, slotLabel(target.startsAt, now));
    }
  } else if (target && plan.action === "handoff") {
    handedOff = true;
    ack = plan.text;
  }

  if (appointmentId && intent) {
    const apptId = appointmentId;
    const applied = intent;
    await withTenant(tenantId, async (tx) => {
      await tx.update(messages).set({ intent: applied, appointmentId: apptId }).where(eq(messages.id, messageId));
      await tx
        .update(appointments)
        .set({ status: STATUS_FOR[applied], replyAt: now })
        .where(eq(appointments.id, apptId));
    });
  } else if (target && handedOff) {
    const apptId = target.id;
    await withTenant(tenantId, (tx) =>
      tx.update(appointments).set({ aiHandoffAt: now }).where(and(eq(appointments.id, apptId), isNull(appointments.aiHandoffAt))),
    );
  }

  // De 21h às 6h nada automático sai: a resposta fica guardada no agendamento e sai às 6h (messaging/pending.ts)
  if (ack && target && isQuietHour(now)) {
    const apptId = target.id;
    const body = ack;
    await withTenant(tenantId, (tx) =>
      tx.update(appointments).set({ pendingReply: body }).where(eq(appointments.id, apptId)),
    ).catch((e) => console.error(JSON.stringify({ level: "warn", msg: "pending_reply_failed", err: String(e) })));
    ack = null;
  }

  if (ack) {
    const port = deps.portFor(msg.instance);
    const body = ack;
    try {
      const sent = port ? await port.sendText(client.phone, body) : null;
      if (sent)
        await withTenant(tenantId, (tx) =>
          recordMessage(tx, tenantId, {
            clientId: client.id,
            appointmentId: target?.id ?? null,
            direction: "out",
            kind: "auto_reply",
            body,
            externalId: sent.id,
          }),
        );
    } catch (e) {
      // O status já mudou; sem a resposta automática a cliente só não recebe o texto
      console.error(JSON.stringify({ level: "warn", msg: "auto_reply_failed", err: String(e) }));
    }
  }

  if (deps.push) {
    const push = deps.push;
    const guess = plan.action === "apply" ? null : plan.guess;
    // Resposta ao lembrete que ninguém tratou (IA desligada, limite de respostas, já passada): a dona ainda precisa saber
    const unattended = !!target && plan.action === "silent" && !plan.quiet;
    const title = pushTitle(client.name, intent, guess, correction, handedOff || unattended);
    // Tocar abre a conversa com a cliente dentro do app
    if (title)
      await withTenant(tenantId, (tx) =>
        sendToAll(tx, push, { title, body: msg.text.slice(0, 140), url: `/agenda?conversa=${client.id}` }),
      ).catch((e) => console.error(JSON.stringify({ level: "warn", msg: "reply_push_failed", err: String(e) })));
  }
  return { handled: true, intent, appointmentId };
}
