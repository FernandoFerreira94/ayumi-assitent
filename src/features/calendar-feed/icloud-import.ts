import { and, eq, gt, isNotNull, isNull, lt, ne, notInArray } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, blocks } from "@/db/schema";
import type { IcloudEvent } from "./icloud";

/**
 * Grava os eventos do iCloud da janela [from, to) como horário ocupado (blocks.source = 'icloud', só leitura).
 * - mesmo começo e fim de um atendimento do app ou de um evento do Google já importado: não duplica
 * - o que sumiu do iPhone na janela é apagado (a janela inteira é refeita); o que mudou é atualizado
 * - evento que já virou atendimento (converted_at) continua escondido
 */
export async function importIcloudEvents(tx: Tx, tenantId: string, fetched: IcloudEvent[], from: Date, to: Date) {
  const [appts, google] = await Promise.all([
    tx
      .select({ s: appointments.startsAt, e: appointments.endsAt })
      .from(appointments)
      .where(and(ne(appointments.status, "cancelled"), lt(appointments.startsAt, to), gt(appointments.endsAt, from))),
    tx
      .select({ s: blocks.startsAt, e: blocks.endsAt })
      .from(blocks)
      .where(and(eq(blocks.source, "google"), lt(blocks.startsAt, to), gt(blocks.endsAt, from))),
  ]);
  const taken = new Set([...appts, ...google].map((r) => `${r.s.getTime()}|${r.e.getTime()}`));
  const events = fetched.filter((e) => !taken.has(`${e.startsAt.getTime()}|${e.endsAt.getTime()}`));

  for (const e of events) {
    await tx
      .insert(blocks)
      .values({
        tenantId,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        reason: e.title,
        source: "icloud",
        externalUid: e.uid,
      })
      .onConflictDoUpdate({
        target: [blocks.tenantId, blocks.externalUid],
        targetWhere: isNotNull(blocks.externalUid),
        set: { startsAt: e.startsAt, endsAt: e.endsAt, reason: e.title },
      });
  }
  const keep = events.map((e) => e.uid);
  await tx
    .delete(blocks)
    .where(
      and(
        eq(blocks.source, "icloud"),
        isNull(blocks.convertedAt),
        lt(blocks.startsAt, to),
        gt(blocks.endsAt, from),
        keep.length ? notInArray(blocks.externalUid, keep) : undefined,
      ),
    );
  return events.length;
}

/** Desligou o calendário do iPhone: some tudo o que veio de lá (o que virou atendimento continua atendimento). */
export const clearIcloudEvents = (tx: Tx) => tx.delete(blocks).where(eq(blocks.source, "icloud"));
