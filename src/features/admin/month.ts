import { z } from "zod";

const MONTH = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);

/** 'YYYY-MM' do instante, no fuso de São Paulo. */
export function monthKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(d);
}

/** Soma n meses a 'YYYY-MM'. */
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Mês do ?mes= (YYYY-MM). Inválido, ausente ou no futuro vira o mês atual (UTC-3). */
export function parseMonth(raw: unknown, now: Date): string {
  const cur = monthKey(now);
  const r = MONTH.safeParse(raw);
  return r.success && r.data <= cur ? r.data : cur;
}
