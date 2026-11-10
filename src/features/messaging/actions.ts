"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, withTenant } from "@/db/client";
import { clients, tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { maskPhone } from "@/lib/phone";
import { requireTenant } from "@/lib/tenant";
import { messagingForInstance } from "./evolution";
import { MAX_MESSAGE, sendDirect } from "./send";
import { listConversation, markRead, recordMessage, type ConversationMessage } from "./store";

const input = z.object({ clientId: z.string().uuid(), text: z.string().trim().min(1).max(MAX_MESSAGE) });
const clientIdOnly = z.string().uuid();

/**
 * Mensagem da dona para uma cliente, pelo WhatsApp do salão. O número vem do banco (da cliente
 * deste salão), nunca do navegador: assim não dá para usar a ação para escrever a qualquer número.
 */
export async function sendClientMessage(clientId: string, text: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = input.safeParse({ clientId, text });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  try {
    const [cli] = await withTenant(tenantId, (tx) =>
      tx.select({ phone: clients.phoneE164 }).from(clients).where(eq(clients.id, p.data.clientId)),
    );
    if (!cli) return fail("NOT_ALLOWED");
    const [t] = await getDb().select({ i: tenants.whatsappInstance }).from(tenants).where(eq(tenants.id, tenantId));
    // Mesma regra dos lembretes: sem instância própria, usa a do ambiente
    const instance = t?.i ?? process.env.EVOLUTION_INSTANCE;
    const res = await sendDirect(instance ? messagingForInstance(instance) : null, cli.phone, p.data.text);
    if (!res.ok) {
      console.error(JSON.stringify({ level: "error", msg: "client_message_failed", code: res.code }));
      return res;
    }
    // Já saiu: falha ao gravar não pode virar "não enviada" (ela tentaria de novo e a cliente receberia duas)
    await withTenant(tenantId, (tx) =>
      recordMessage(tx, tenantId, { clientId: p.data.clientId, direction: "out", kind: "manual", body: p.data.text, externalId: res.data.id }),
    ).catch((e) => console.error(JSON.stringify({ level: "warn", msg: "client_message_record_failed", err: String(e) })));
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Conversa com a cliente para a folha; abrir marca as recebidas como lidas (somem do sino). */
export async function loadConversation(clientId: string): Promise<ActionResult<ConversationMessage[]>> {
  const { tenantId } = await requireTenant();
  const id = clientIdOnly.safeParse(clientId);
  if (!id.success) return fail("VALIDATION");
  try {
    return ok(
      await withTenant(tenantId, async (tx) => {
        await markRead(tx, id.data);
        return listConversation(tx, id.data);
      }),
    );
  } catch {
    return fail("UNKNOWN");
  }
}

/** Nome e telefone da cliente para abrir a conversa a partir de uma notificação (só clientes deste salão). */
export async function loadChatClient(clientId: string): Promise<ActionResult<{ name: string; phone: string }>> {
  const { tenantId } = await requireTenant();
  const id = clientIdOnly.safeParse(clientId);
  if (!id.success) return fail("VALIDATION");
  try {
    const [cli] = await withTenant(tenantId, (tx) =>
      tx.select({ name: clients.name, phone: clients.phoneE164 }).from(clients).where(eq(clients.id, id.data)),
    );
    if (!cli) return fail("NOT_ALLOWED");
    return ok({ name: cli.name, phone: maskPhone(cli.phone) });
  } catch {
    return fail("UNKNOWN");
  }
}
