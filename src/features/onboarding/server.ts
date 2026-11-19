import "server-only";
import { sql } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { workingHours } from "@/db/schema";
import { getHours } from "@/features/hours/core";
import type { Day } from "@/features/hours/slots";
import { ENTRY_DEFAULT_WEEK } from "./hours";

/**
 * A entrada ainda vale para esta pessoa? Sim enquanto não terminou a entrada nem o tour: quem já viu o tour
 * (conta antiga) nunca cai nela, mesmo sem o marcador novo.
 */
export async function onboardingPending(userId: string): Promise<boolean> {
  const rows = await getDb().execute<{ pending: boolean }>(
    sql`select (onboarding_done_at is null and tour_done_at is null) as pending from memberships where user_id = ${userId} limit 1`,
  );
  return rows[0]?.pending === true;
}

/** Expediente para a tela de Horários: o que já foi salvo, ou o padrão da entrada (seg–sex, 9h–18h, almoço 12h–13h). */
export async function entryHours(tenantId: string): Promise<Day[]> {
  return withTenant(tenantId, async (tx) => {
    const saved = await tx.select({ weekday: workingHours.weekday }).from(workingHours);
    return saved.length > 0 ? getHours(tx) : ENTRY_DEFAULT_WEEK;
  });
}
