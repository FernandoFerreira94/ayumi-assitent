import "server-only";
import { withTenant } from "@/db/client";
import { listDay, receivedCents } from "@/features/appointments/core";
import { listBlocks } from "@/features/blocks/core";
import { getHours } from "@/features/hours/core";
import { freeSlots, weekdayOf } from "@/features/hours/slots";
import { listBookable } from "@/features/services/core";
import { addDays, dayRange, todayStr } from "@/lib/dates";
import type { MascotFacts } from "@/features/appointments/mascot-lines";

/**
 * O que a Bolha conta no Painel além do dia: recebido no mês, horários livres hoje (do mesmo serviço da tela de
 * Vagas) e quantos atendimentos tem amanhã. Só para hoje; consultas pequenas que valem no celular também.
 */
export async function loadMascotFacts(tenantId: string, now = new Date()): Promise<MascotFacts> {
  const today = todayStr(now);
  const tomorrow = addDays(today, 1);
  const span = (from: string, to: string): [Date, Date] => [dayRange(from)[0], dayRange(to)[1]];

  return withTenant(tenantId, async (tx) => {
    const [monthRows, nearRows, blocks, hours, services] = await Promise.all([
      listDay(tx, span(`${today.slice(0, 7)}-01`, today)),
      listDay(tx, span(today, tomorrow)),
      listBlocks(tx, dayRange(today)),
      getHours(tx),
      listBookable(tx),
    ]);
    const service = services.find((s) => s.showInSlots) ?? null;
    const day = hours[weekdayOf(today)];
    // Dia fechado ou sem serviço em Vagas: a Bolha não fala de vagas (não é "agenda cheia")
    const free = service && day
      ? freeSlots({
          date: today,
          day,
          durationMin: service.durationMin + service.bufferMin,
          busy: [...nearRows.map((a) => ({ startsAt: a.startsAt, endsAt: a.blockedUntil })), ...blocks],
          notBefore: now,
        })
      : null;
    return {
      monthReceivedCents: receivedCents(monthRows),
      freeToday: free,
      tomorrowCount: nearRows.filter((r) => todayStr(r.startsAt) === tomorrow && r.status !== "no_show").length,
    };
  });
}
