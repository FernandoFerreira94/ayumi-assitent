import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { clients, messages } from "@/db/schema";
import type { Intent } from "./replies";

export type MessageKind = "manual" | "reminder" | "auto_reply" | "phone" | "client";

export type NewMessage = {
  clientId: string;
  appointmentId?: string | null;
  direction: "out" | "in";
  kind: MessageKind;
  body: string;
  intent?: Intent | null;
  externalId?: string | null;
  createdAt?: Date;
};

/** Grava uma mensagem; devolve null quando o id do WhatsApp já existe (webhook repetido ou eco do envio). */
export async function recordMessage(tx: Tx, tenantId: string, m: NewMessage): Promise<string | null> {
  const rows = await tx
    .insert(messages)
    .values({ tenantId, ...m, intent: m.intent ?? null, externalId: m.externalId ?? null })
    .onConflictDoNothing({ target: [messages.tenantId, messages.externalId] })
    .returning({ id: messages.id });
  return rows[0]?.id ?? null;
}

export type ConversationMessage = {
  id: string;
  direction: "out" | "in";
  kind: MessageKind;
  body: string;
  intent: Intent | null;
  createdAt: string;
};

/** As últimas mensagens com a cliente, da mais antiga para a mais nova (como a tela mostra). */
export async function listConversation(tx: Tx, clientId: string, limit = 80): Promise<ConversationMessage[]> {
  const rows = await tx
    .select({
      id: messages.id,
      direction: messages.direction,
      kind: messages.kind,
      body: messages.body,
      intent: messages.intent,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.clientId, clientId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse().map((r) => ({
    ...r,
    direction: r.direction as "out" | "in",
    kind: r.kind as MessageKind,
    intent: (r.intent as Intent | null) ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** A dona abriu a conversa: as recebidas deixam de ser aviso no sino. */
export const markRead = (tx: Tx, clientId: string) =>
  tx
    .update(messages)
    .set({ readAt: sql`now()` })
    .where(and(eq(messages.clientId, clientId), eq(messages.direction, "in"), isNull(messages.readAt)));

export type Unread = {
  clientId: string;
  clientName: string;
  count: number;
  lastBody: string;
  lastIntent: Intent | null;
};

/** Clientes com mensagem nova não lida, com a última recebida (para o sino). */
export async function listUnread(tx: Tx): Promise<Unread[]> {
  const rows = await tx
    .select({
      clientId: messages.clientId,
      clientName: clients.name,
      body: messages.body,
      intent: messages.intent,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(clients, eq(clients.id, messages.clientId))
    .where(and(eq(messages.direction, "in"), isNull(messages.readAt)))
    .orderBy(asc(messages.createdAt));
  const by = new Map<string, Unread>();
  for (const r of rows) {
    const u = by.get(r.clientId) ?? {
      clientId: r.clientId,
      clientName: r.clientName,
      count: 0,
      lastBody: "",
      lastIntent: null,
    };
    u.count++;
    u.lastBody = r.body;
    u.lastIntent = (r.intent as Intent | null) ?? u.lastIntent;
    by.set(r.clientId, u);
  }
  return [...by.values()];
}
