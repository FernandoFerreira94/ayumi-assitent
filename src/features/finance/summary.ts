import { forecastCents, receivedCents } from "@/features/appointments/core";
import type { Status } from "@/features/appointments/schema";

type Row = { priceCents: number; status: Status; serviceName: string };

export type Slice = { name: string; cents: number };

/** A pizza só serve para ver a divisão de relance: até 5 serviços e o resto junto em "Outros". */
export const MAX_SLICES = 6;

/** Já ordenadas da maior para a menor: até 5 fatias e o resto junto em "Outros". */
export function topSlices(sorted: Slice[]): Slice[] {
  return sorted.length <= MAX_SLICES
    ? sorted
    : [
        ...sorted.slice(0, MAX_SLICES - 1),
        { name: "Outros", cents: sorted.slice(MAX_SLICES - 1).reduce((s, x) => s + x.cents, 0) },
      ];
}

/** Ganho do período: o recebido vem dos concluídos, o previsto soma o que ainda não faltou. */
export function summarize(rows: Row[]) {
  const done = rows.filter((r) => r.status === "done");
  const received = receivedCents(rows);
  const byService = new Map<string, number>();
  for (const r of done) byService.set(r.serviceName, (byService.get(r.serviceName) ?? 0) + r.priceCents);
  const sorted = [...byService].map(([name, cents]) => ({ name, cents })).sort((a, b) => b.cents - a.cents);
  const slices = topSlices(sorted);
  return {
    received,
    forecast: forecastCents(rows),
    doneCount: done.length,
    averageCents: done.length ? Math.round(received / done.length) : 0,
    slices,
  };
}
