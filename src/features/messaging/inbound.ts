import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb, withTenant, type Tx } from "@/db/client";
import { appointments, clients, messages, tenants } from "@/db/schema";
import { sendToAll } from "@/features/push/core";
import type { PushPort } from "@/features/push/port";
import {
  ANSWER_WINDOW_HOURS,
  CORRECTION_HOURS,
  looksLikeAnswer,
  OWNER_QUIET_HOURS,
  planAiReply,
  type AiPlan,
  type AiVerdict,
} from "./ai-policy";
import type { MessagingPort } from "./port";
import { isQuietHour } from "@/features/reminders/quiet";
import { slotLabel } from "@/features/reminders/text";
import {
  ackText,
  isOptionReply,
  OPT_IN_TEXT,
  OPT_OUT_TEXT,
  parseIntent,
  parseOptOut,
  phoneCandidates,
  type InboundText,
  type Intent,
} from "./replies";
import { recordMessage } from "./store";
import { errCode } from "@/lib/log";

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
const pushTitle = (
  name: string,
  intent: Intent | null,
  guess: Intent | null,
  correction: boolean,
  handedOff: boolean,
  ambiguous = false,
) => {
  const first = firstName(name);
  if (correction && intent) return `${first} corrigiu a resposta: ${GUESS_LABEL[intent]}`;
  if (intent === "confirm") return `${first} confirmou o horário`;
  if (intent === "cancel") return `${first} quer cancelar`;
  if (intent === "reschedule") return `${first} quer remarcar`;
  if (guess === "cancel" || guess === "reschedule") return `${first} parece querer ${GUESS_LABEL[guess]}`;
  if (handedOff) return `${first} precisa de você na conversa`;
  if (ambiguous) return `${first} respondeu, mas tem mais de um horário em aberto: confira a conversa`;
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

type Target = {
  id: string;
  handedOff: boolean;
  correction: boolean;
  status: string;
  startsAt: Date;
  /** Quando saiu o último lembrete (ou quando a cliente respondeu, na correção) */
  since: Date;
};

/** Folga para o eco do próprio lembrete, que pode chegar pelo webhook antes de ser gravado e virar "phone". */
const ECHO_GRACE_MS = 2 * 60_000;

/** A dona mandou mensagem (app ou celular) para a cliente depois de `since`. */
async function ownerWroteSince(tx: Tx, clientId: string, since: Date): Promise<boolean> {
  const [row] = await tx
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.clientId, clientId),
        eq(messages.direction, "out"),
        inArray(messages.kind, ["phone", "manual"]),
        gt(messages.createdAt, new Date(since.getTime() + ECHO_GRACE_MS)),
      ),
    )
    .limit(1);
  return !!row;
}

/**
 * A cliente respondeu citando uma mensagem. `null` = citou algo que não é pergunta de horário (confirmação do
 * agendamento, conversa com a dona, mensagem antiga) ou o horário já mudou/passou: é conversa, nada automático.
 * `undefined` = a mensagem citada não está na conversa (caímos na regra sem citação).
 */
async function quotedAppointment(
  tx: Tx,
  clientId: string,
  quotedId: string,
  now: Date,
): Promise<Target | null | undefined> {
  const [q] = await tx
    .select({ kind: messages.kind, appointmentId: messages.appointmentId, at: messages.createdAt })
    .from(messages)
    .where(and(eq(messages.clientId, clientId), eq(messages.externalId, quotedId), eq(messages.direction, "out")))
    .limit(1);
  if (!q) return undefined;
  if (q.kind !== "reminder" || !q.appointmentId) return null;
  const [a] = await tx
    .select({
      id: appointments.id,
      handoff: appointments.aiHandoffAt,
      status: appointments.status,
      startsAt: appointments.startsAt,
      reminderAt: appointments.reminderSentAt,
      replyAt: appointments.replyAt,
    })
    .from(appointments)
    .where(eq(appointments.id, q.appointmentId));
  // Remarcado depois do lembrete (lembrete zerado ou mais novo que a citação), passado ou fechado: não vale mais
  if (!a || a.startsAt <= now || !a.reminderAt || a.reminderAt > q.at) return null;
  if (!["pending_confirmation", "confirmed", "reschedule_requested"].includes(a.status)) return null;
  const correction = !!a.replyAt;
  if (correction && a.replyAt! < new Date(now.getTime() - CORRECTION_HOURS * 3_600_000)) return null;
  return {
    id: a.id,
    handedOff: !!a.handoff,
    correction,
    status: a.status,
    startsAt: a.startsAt,
    since: correction ? a.replyAt! : q.at,
  };
}

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
    .select({
      id: tenants.id,
      aiEnabled: tenants.aiEnabled,
      aiRules: tenants.aiRules,
      fullName: tenants.clientNameFull,
    })
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
        createdAt: now,
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

    // SAIR / VOLTAR: vale para qualquer mensagem, com ou sem lembrete esperando, e não passa pela IA
    const optOut = msg.media ? null : parseOptOut(msg.text);
    if (optOut) {
      const stop = optOut === "stop";
      const changed = await tx
        .update(clients)
        .set({ optedOutAt: stop ? now : null })
        .where(and(eq(clients.id, cli.id), stop ? isNull(clients.optedOutAt) : isNotNull(clients.optedOutAt)))
        .returning({ id: clients.id });
      return { kind: "optout", client: cli, ack: changed.length ? (stop ? OPT_OUT_TEXT : OPT_IN_TEXT) : null } as const;
    }

    // Alvo da mensagem. Com citação, vale a mensagem citada: só um lembrete (ou pergunta do sistema) liga a resposta
    // a um agendamento; citar a confirmação ou uma conversa é falar com a dona. Sem citação: o lembrete que ainda
    // espera resposta, se for um só; se não há, a resposta dada há pouco (a cliente pode ter errado o número e corrigir)
    let target: Target | null = null;
    let ambiguous = false;
    const quoted = msg.quotedId ? await quotedAppointment(tx, cli.id, msg.quotedId, now) : undefined;
    if (quoted !== undefined) {
      if (quoted) target = quoted;
    } else {
      const opens = await tx
        .select({
          id: appointments.id,
          handoff: appointments.aiHandoffAt,
          status: appointments.status,
          startsAt: appointments.startsAt,
          reminderAt: appointments.reminderSentAt,
          nudgeAt: appointments.nudgeSentAt,
        })
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
        .limit(2);
      const open = opens[0];
      // Dois lembretes esperando resposta (dias diferentes): sem citação não dá para saber qual; a dona decide
      if (opens.length > 1) ambiguous = true;
      else if (open)
        target = {
          id: open.id,
          handedOff: !!open.handoff,
          correction: false,
          status: open.status,
          startsAt: open.startsAt,
          // O 2º lembrete reabre a pergunta: vale o mais recente dos dois
          since: open.nudgeAt && open.nudgeAt > open.reminderAt! ? open.nudgeAt : open.reminderAt!,
        };
      else {
        const [recent] = await tx
          .select({
            id: appointments.id,
            handoff: appointments.aiHandoffAt,
            status: appointments.status,
            startsAt: appointments.startsAt,
            replyAt: appointments.replyAt,
          })
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
            since: recent.replyAt!,
          };
      }
    }

    // A dona escreveu depois do lembrete (ou da resposta): o que a cliente manda agora responde a ela,
    // não ao lembrete. "2" para "quantas unhas?" não pode virar pedido de cancelar
    if (target && (await ownerWroteSince(tx, cli.id, target.since))) target = null;
    // Pergunta velha (mais de 12 h): a mensagem é conversa, não resposta
    if (target && !target.correction && now.getTime() - target.since.getTime() > ANSWER_WINDOW_HOURS * 3_600_000)
      target = null;

    // Regras simples primeiro: de graça e previsíveis. Lista ou texto longo nunca é resposta
    let ruleIntent = target && !msg.media && looksLikeAnswer(msg.text) ? parseIntent(msg.text) : null;
    // Depois de respondido, só o número troca a resposta ("ops, é 3"); o resto é conversa
    if (target?.correction && !(ruleIntent && isOptionReply(msg.text))) {
      ruleIntent = null;
      target = null;
    }

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
    return { kind: "reply", client: cli, messageId, target, ruleIntent, ai, ambiguous } as const;
  });

  if (step.kind === "skip") return { handled: false, reason: step.reason };
  if (step.kind === "done") return { handled: true, intent: null, appointmentId: null };
  if (step.kind === "optout") {
    // Responde uma vez (só quando mudou) e respeita o silêncio da noite; a escolha já está gravada
    if (step.ack && !isQuietHour(now)) await sendAutoReply(deps, msg.instance, tenantId, step.client, null, step.ack);
    return { handled: true, intent: null, appointmentId: null };
  }

  const { client, messageId, target, ruleIntent, ai, ambiguous } = step;

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
        alreadyHandedOff: target.handedOff,
      },
      () => classify(msg.text, t.aiRules),
    );
  } else if (target && !ruleIntent && looksLikeAnswer(msg.text))
    // IA desligada (ou sem modelo): parece resposta mas não deu para entender; a dona fica sabendo uma vez
    plan = { action: "silent", guess: null, quiet: target.handedOff };
  else plan = { action: "silent", guess: null, quiet: true };

  // Cancelar ou remarcar só pelo número (2 ou 3). Texto livre ("não vou poder") não muda nada e não gera resposta:
  // só avisa a dona ("parece querer cancelar"), que conversa com a cliente
  if (target && plan.action === "apply" && plan.intent !== "confirm" && !(ruleIntent && isOptionReply(msg.text)))
    plan = { action: "silent", guess: plan.intent, quiet: false };

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
  } else if (target && plan.action === "silent" && !plan.quiet) {
    // Avisa a dona uma vez por pergunta (marca para não repetir o aviso a cada mensagem)
    handedOff = true;
  }

  if (appointmentId && intent) {
    const apptId = appointmentId;
    const applied = intent;
    await withTenant(tenantId, async (tx) => {
      await tx.update(messages).set({ intent: applied, appointmentId: apptId }).where(eq(messages.id, messageId));
      // Só se o agendamento continua como estava quando a mensagem foi lida (a dona pode ter mudado no meio)
      await tx
        .update(appointments)
        .set({ status: STATUS_FOR[applied], replyAt: now })
        .where(
          and(
            eq(appointments.id, apptId),
            // Comparação em milissegundos (o Date do JS não guarda os microssegundos do Postgres)
            sql`date_trunc('milliseconds', ${appointments.startsAt}) = ${target!.startsAt.toISOString()}::timestamptz`,
            inArray(appointments.status, ["pending_confirmation", "confirmed", "reschedule_requested"]),
          ),
        );
    });
  } else if (target && handedOff) {
    const apptId = target.id;
    await withTenant(tenantId, (tx) =>
      tx
        .update(appointments)
        .set({ aiHandoffAt: now })
        .where(and(eq(appointments.id, apptId), isNull(appointments.aiHandoffAt))),
    );
  }

  // De 21h às 6h nada automático sai: a resposta fica guardada no agendamento e sai às 6h (messaging/pending.ts)
  if (ack && target && isQuietHour(now)) {
    const apptId = target.id;
    const body = ack;
    await withTenant(tenantId, (tx) =>
      tx.update(appointments).set({ pendingReply: body }).where(eq(appointments.id, apptId)),
    ).catch((e) => console.error(JSON.stringify({ level: "warn", msg: "pending_reply_failed", ...errCode(e) })));
    ack = null;
  }

  if (ack) await sendAutoReply(deps, msg.instance, tenantId, client, target?.id ?? null, ack);

  if (deps.push) {
    const push = deps.push;
    const guess = plan.action === "apply" ? null : plan.guess;
    const title = pushTitle(client.name, intent, guess, correction, handedOff, ambiguous);
    // Tocar abre a conversa com a cliente dentro do app
    if (title)
      await withTenant(tenantId, (tx) =>
        sendToAll(tx, push, { title, body: msg.text.slice(0, 140), url: `/agenda?conversa=${client.id}` }),
      ).catch((e) => console.error(JSON.stringify({ level: "warn", msg: "reply_push_failed", ...errCode(e) })));
  }
  return { handled: true, intent, appointmentId };
}

/** Resposta automática à cliente, gravada na conversa. Falha só loga: o que mudou no banco já vale. */
async function sendAutoReply(
  deps: InboundDeps,
  instance: string,
  tenantId: string,
  client: { id: string; phone: string },
  appointmentId: string | null,
  body: string,
) {
  const port = deps.portFor(instance);
  try {
    const sent = port ? await port.sendText(client.phone, body) : null;
    if (sent)
      await withTenant(tenantId, (tx) =>
        recordMessage(tx, tenantId, {
          clientId: client.id,
          appointmentId,
          direction: "out",
          kind: "auto_reply",
          body,
          externalId: sent.id,
        }),
      );
  } catch (e) {
    console.error(JSON.stringify({ level: "warn", msg: "auto_reply_failed", ...errCode(e) }));
  }
}
