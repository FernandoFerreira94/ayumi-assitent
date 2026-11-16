"use server";

import { and, asc, eq, gt, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { appointmentServices, appointments, clients, services } from "@/db/schema";
import { listDay } from "@/features/appointments/core";
import { listBlocks } from "@/features/blocks/core";
import { syncExternalCalendars } from "@/features/blocks/external-sync";
import { getHours } from "@/features/hours/core";
import { freeSlots, weekdayOf } from "@/features/hours/slots";
import { dayRange, todayStr } from "@/lib/dates";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { pickReturnDays, returnWindow, type ReturnDay } from "./rules";

const uuid = z.string().uuid();

export type ReturnSuggestion =
  /** Sem retorno a sugerir: serviço sem retorno, "Não precisa" ou a cliente já tem horário marcado. */
  | { kind: "none" }
  | {
      kind: "suggest";
      due: string;
      clientId: string;
      clientName: string;
      /** serviços do atendimento que ainda podem ser agendados, na ordem dele */
      serviceIds: string[];
      serviceLabel: string;
      days: ReturnDay[];
    };

/**
 * Sugestão de retorno de um atendimento concluído: dias perto da data prevista com os primeiros
 * horários livres para os mesmos serviços (expediente − agendamentos − bloqueios − pausa).
 */
export async function loadReturnSuggestions(appointmentId: string): Promise<ActionResult<ReturnSuggestion>> {
  const { tenantId } = await requireTenant();
  if (!uuid.safeParse(appointmentId).success) return fail("NOT_ALLOWED");
  try {
    // eventos do Google/iCloud também ocupam (limite de 2 min por estúdio, como em Vagas)
    await syncExternalCalendars(tenantId);
    const res = await withTenant(tenantId, async (tx): Promise<ReturnSuggestion | null> => {
      const [a] = await tx
        .select({
          clientId: appointments.clientId,
          clientName: clients.name,
          status: appointments.status,
          due: appointments.returnDueOn,
          skipped: appointments.returnSkippedAt,
          serviceId: appointments.serviceId,
        })
        .from(appointments)
        .innerJoin(clients, eq(clients.id, appointments.clientId))
        .where(eq(appointments.id, appointmentId));
      if (!a) return null;
      if (a.status !== "done" || !a.due || a.skipped) return { kind: "none" };

      // já tem horário marcado daqui para frente: não pergunta de novo
      const [next] = await tx
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.clientId, a.clientId),
            gt(appointments.startsAt, new Date()),
            ne(appointments.status, "cancelled"),
          ),
        )
        .limit(1);
      if (next) return { kind: "none" };

      const parts = await tx
        .select({ serviceId: appointmentServices.serviceId })
        .from(appointmentServices)
        .where(eq(appointmentServices.appointmentId, appointmentId))
        .orderBy(asc(appointmentServices.position));
      const ids = parts.length ? parts.map((p) => p.serviceId) : [a.serviceId];
      const rows = await tx
        .select({
          id: services.id,
          name: services.name,
          durationMin: services.durationMin,
          bufferMin: services.bufferMin,
          active: services.active,
          bookable: services.bookable,
        })
        .from(services)
        .where(inArray(services.id, ids));
      // excluído ou pausado não entra no agendamento novo
      const list = ids
        .map((id) => rows.find((r) => r.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s?.active && s.bookable));
      if (!list.length) return { kind: "none" };
      // mesma conta do agendar: soma das durações + o maior intervalo depois
      const durationMin = list.reduce((n, s) => n + s.durationMin, 0) + Math.max(...list.map((s) => s.bufferMin));

      const window = returnWindow(a.due, todayStr());
      const sorted = [...window].sort();
      const range: [Date, Date] = [dayRange(sorted[0])[0], dayRange(sorted[sorted.length - 1])[1]];
      const [appts, blks, week] = await Promise.all([listDay(tx, range), listBlocks(tx, range), getHours(tx)]);
      const busy = [...appts.map((x) => ({ startsAt: x.startsAt, endsAt: x.blockedUntil })), ...blks];
      const days = pickReturnDays(window, (date) => freeSlots({ date, day: week[weekdayOf(date)], durationMin, busy }));
      return {
        kind: "suggest",
        due: a.due,
        clientId: a.clientId,
        clientName: a.clientName,
        serviceIds: list.map((s) => s.id),
        serviceLabel: list.map((s) => s.name).join(" + "),
        days,
      };
    });
    return res ? ok(res) : fail("NOT_ALLOWED");
  } catch {
    return fail("UNKNOWN");
  }
}

/** "Não precisa": tira o retorno deste atendimento da pergunta e da lista Para chamar. */
export async function skipReturn(appointmentId: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  if (!uuid.safeParse(appointmentId).success) return fail("NOT_ALLOWED");
  try {
    const rows = await withTenant(tenantId, (tx) =>
      tx
        .update(appointments)
        .set({ returnSkippedAt: new Date() })
        .where(and(eq(appointments.id, appointmentId), eq(appointments.status, "done")))
        .returning({ id: appointments.id }),
    );
    return rows.length ? ok() : fail("NOT_ALLOWED");
  } catch {
    return fail("UNKNOWN");
  }
}
