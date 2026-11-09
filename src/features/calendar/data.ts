import type { Tx } from "@/db/client";
import { serviceTone } from "@/features/appointments/agenda-grid";
import { listDay } from "@/features/appointments/core";
import { dayRange, todayStr } from "@/lib/dates";

/** Até quantas pílulas o mês mostra por dia; o resto vira "+N". */
export const MAX_PILLS = 3;

export type DayPill = { name: string; tone: number };
/** Resumo do ano por dia: quantos atendimentos e as primeiras pílulas (primeiro nome + cor do serviço). */
export type YearDays = Record<string, { n: number; pills: DayPill[] }>;

const first = (n: string) => n.trim().split(/\s+/)[0];

/** Um ano inteiro numa consulta, já enxuto para o celular trocar de mês e ano sem voltar ao servidor. */
export async function loadYearDays(tx: Tx, year: string): Promise<YearDays> {
  const rows = await listDay(tx, [dayRange(`${year}-01-01`)[0], dayRange(`${year}-12-31`)[1]]);
  const days: YearDays = {};
  for (const r of rows) {
    const d = todayStr(r.startsAt);
    const cur = (days[d] ??= { n: 0, pills: [] });
    cur.n++;
    if (cur.pills.length < MAX_PILLS) cur.pills.push({ name: first(r.clientName), tone: serviceTone(r.serviceId) });
  }
  return days;
}
