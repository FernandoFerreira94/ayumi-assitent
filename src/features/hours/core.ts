import { eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { workingHours } from "@/db/schema";
import { DEFAULT_HOURS, type Day } from "./slots";

/** Expediente por dia da semana (0 = domingo). Sem nenhuma linha salva, usa o padrão. */
export async function getHours(tx: Tx): Promise<Day[]> {
  const rows = await tx.select().from(workingHours);
  if (rows.length === 0) return DEFAULT_HOURS;
  const week: Day[] = Array.from({ length: 7 }, () => null);
  for (const r of rows) week[r.weekday] = { opens: r.opens, closes: r.closes };
  return week;
}

export async function saveHours(tx: Tx, tenantId: string, week: Day[]) {
  await tx.delete(workingHours).where(eq(workingHours.tenantId, tenantId));
  const values = week.flatMap((d, weekday) => (d ? [{ tenantId, weekday, opens: d.opens, closes: d.closes }] : []));
  if (values.length) await tx.insert(workingHours).values(values);
}
