import { and, eq, gt, isNotNull, lt, notInArray } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { appointments, blocks } from "@/db/schema";
import type { CalendarReader } from "./calendar";

/**
 * Traz os eventos do Google Agenda da janela [from, to) como horário ocupado (blocks.source = 'google').
 * - eventos que o próprio app criou (appointments.google_event_id) não voltam: já são atendimentos
 * - o que sumiu ou mudou no Google é atualizado/removido aqui (a janela inteira é refeita)
 * Lança se o Google falhar: nada é apagado sem a lista completa.
 */
export async function importGoogleEvents(tx: Tx, tenantId: string, reader: CalendarReader, from: Date, to: Date) {
  const fetched = await reader.listEvents(from, to);
  const own = new Set(
    (
      await tx
        .select({ id: appointments.googleEventId })
        .from(appointments)
        .where(isNotNull(appointments.googleEventId))
    )
      .map((r) => r.id)
      .filter((x): x is string => !!x),
  );
  const events = fetched.filter((e) => !own.has(e.id));
  for (const e of events) {
    await tx
      .insert(blocks)
      .values({
        tenantId,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        reason: e.title,
        source: "google",
        googleEventId: e.id,
      })
      .onConflictDoUpdate({
        target: [blocks.tenantId, blocks.googleEventId],
        targetWhere: isNotNull(blocks.googleEventId),
        set: { startsAt: e.startsAt, endsAt: e.endsAt, reason: e.title },
      });
  }
  const keep = events.map((e) => e.id);
  await tx
    .delete(blocks)
    .where(
      and(
        eq(blocks.source, "google"),
        lt(blocks.startsAt, to),
        gt(blocks.endsAt, from),
        keep.length ? notInArray(blocks.googleEventId, keep) : undefined,
      ),
    );
  return events.length;
}
