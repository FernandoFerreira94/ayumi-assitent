import { z } from "zod";
import { monthKey } from "./demo-data";

const MONTH = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);

/** Mês do ?mes= (YYYY-MM). Inválido, ausente ou no futuro vira o mês atual (UTC-3). */
export function parseMonth(raw: unknown, now: Date): string {
  const cur = monthKey(now);
  const r = MONTH.safeParse(raw);
  return r.success && r.data <= cur ? r.data : cur;
}
