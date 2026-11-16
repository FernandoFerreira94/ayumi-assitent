import { eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { workingHours } from "@/db/schema";
import { defaultProfessionalId, firstProfessionalId } from "@/features/team/professional";
import { DEFAULT_HOURS, type Day } from "./slots";

/**
 * Expediente por dia da semana (0 = domingo) de uma profissional. Sem nenhuma linha salva, usa o padrão.
 * Sem `professionalId`, vale o da profissional padrão do salão (a primeira por posição).
 */
export async function getHours(tx: Tx, professionalId?: string): Promise<Day[]> {
  const prof = professionalId ?? (await firstProfessionalId(tx));
  if (!prof) return DEFAULT_HOURS;
  const rows = await tx.select().from(workingHours).where(eq(workingHours.professionalId, prof));
  if (rows.length === 0) return DEFAULT_HOURS;
  const week: Day[] = Array.from({ length: 7 }, () => null);
  for (const r of rows)
    week[r.weekday] = { opens: r.opens, closes: r.closes, breakStart: r.breakStart, breakEnd: r.breakEnd };
  return week;
}

export async function saveHours(tx: Tx, tenantId: string, week: Day[], professionalId?: string) {
  const prof = professionalId ?? (await defaultProfessionalId(tx, tenantId));
  await tx.delete(workingHours).where(eq(workingHours.professionalId, prof));
  const values = week.flatMap((d, weekday) =>
    d
      ? [
          {
            tenantId,
            professionalId: prof,
            weekday,
            opens: d.opens,
            closes: d.closes,
            breakStart: d.breakStart ?? null,
            breakEnd: d.breakEnd ?? null,
          },
        ]
      : [],
  );
  if (values.length) await tx.insert(workingHours).values(values);
}
