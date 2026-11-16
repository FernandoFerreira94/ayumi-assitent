import { and, eq, gt, isNotNull, isNull, lt, ne, notInArray, or, sql } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, blocks } from "@/db/schema";
import type { IcloudEvent } from "./icloud";

/**
 * Grava os eventos do iCloud da profissional na janela [from, to) como horário ocupado
 * (blocks.source = 'icloud', só leitura, na agenda dela).
 * - mesmo começo e fim de um atendimento dela ou de um evento do Google dela já importado: não duplica
 * - o que sumiu do iPhone na janela é apagado (a janela inteira é refeita); o que mudou é atualizado
 * - evento que já virou atendimento (converted_at) continua escondido
 * - bloco antigo sem profissional (importado antes da equipe) é adotado por quem o importa; a limpeza só mexe
 *   nos blocos dela e nesses antigos
 */
export async function importIcloudEvents(
  tx: Tx,
  tenantId: string,
  professionalId: string,
  fetched: IcloudEvent[],
  from: Date,
  to: Date,
) {
  const mine = or(eq(blocks.professionalId, professionalId), isNull(blocks.professionalId));
  const [appts, google] = await Promise.all([
    tx
      .select({ s: appointments.startsAt, e: appointments.endsAt })
      .from(appointments)
      .where(
        and(
          eq(appointments.professionalId, professionalId),
          ne(appointments.status, "cancelled"),
          lt(appointments.startsAt, to),
          gt(appointments.endsAt, from),
        ),
      ),
    tx
      .select({ s: blocks.startsAt, e: blocks.endsAt })
      .from(blocks)
      .where(and(eq(blocks.source, "google"), mine, lt(blocks.startsAt, to), gt(blocks.endsAt, from))),
  ]);
  const taken = new Set([...appts, ...google].map((r) => `${r.s.getTime()}|${r.e.getTime()}`));
  const events = fetched.filter((e) => !taken.has(`${e.startsAt.getTime()}|${e.endsAt.getTime()}`));

  for (const e of events) {
    await tx
      .insert(blocks)
      .values({
        tenantId,
        professionalId,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        reason: e.title,
        source: "icloud",
        externalUid: e.uid,
      })
      .onConflictDoUpdate({
        target: [blocks.tenantId, blocks.externalUid],
        targetWhere: isNotNull(blocks.externalUid),
        set: {
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          reason: e.title,
          professionalId: sql`coalesce(${blocks.professionalId}, ${professionalId})`,
        },
      });
  }
  const keep = events.map((e) => e.uid);
  await tx
    .delete(blocks)
    .where(
      and(
        eq(blocks.source, "icloud"),
        mine,
        isNull(blocks.convertedAt),
        lt(blocks.startsAt, to),
        gt(blocks.endsAt, from),
        keep.length ? notInArray(blocks.externalUid, keep) : undefined,
      ),
    );
  return events.length;
}

/**
 * Desligou o calendário do iPhone da profissional: some tudo o que veio de lá (o que virou atendimento continua
 * atendimento). Não toca no iCloud das outras profissionais; os antigos sem profissional saem junto.
 */
export const clearIcloudEvents = (tx: Tx, professionalId: string) =>
  tx
    .delete(blocks)
    .where(
      and(eq(blocks.source, "icloud"), or(eq(blocks.professionalId, professionalId), isNull(blocks.professionalId))),
    );
