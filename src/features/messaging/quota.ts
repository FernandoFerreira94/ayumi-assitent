import { and, eq, gte, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { messages } from "@/db/schema";
import { dayRange, todayStr } from "@/lib/dates";

/**
 * Limites de uso por estúdio. Hoje fixos; na cobrança viram limite por plano.
 * Protegem o número do salão (WhatsApp bloqueia quem dispara demais) e o custo.
 */
export const MANUAL_DAILY_LIMIT = 150;
/** Texto da cliente que vai para a IA: resposta a lembrete é curta; o resto é conversa para a dona ler. */
export const AI_TEXT_MAX = 500;
export const AI_RULES_MAX = 1_000;

export const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text);

/** O estúdio já mandou o máximo de mensagens manuais hoje (dia de Brasília)? RLS: conta só as dele. */
export async function overDailyLimit(tx: Tx, now = new Date(), limit = MANUAL_DAILY_LIMIT): Promise<boolean> {
  const [start] = dayRange(todayStr(now));
  const [{ n }] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.direction, "out"), eq(messages.kind, "manual"), gte(messages.createdAt, start)));
  return n >= limit;
}
