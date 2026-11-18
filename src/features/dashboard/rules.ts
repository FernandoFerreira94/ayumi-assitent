import type { Status } from "@/features/appointments/schema";

/** Atendimento que ainda vai acontecer (ou está acontecendo): não concluído, sem falta, sem cancelamento. */
const OPEN: Status[] = ["pending_confirmation", "confirmed", "reschedule_requested"];

type Row = { startsAt: Date; endsAt: Date; status: Status };

/**
 * Próxima cliente do Painel: a que está sendo atendida agora (começou e ainda não acabou) ou a próxima do dia.
 * Em outro dia (`now` = começo do dia), é a primeira do dia.
 */
export function pickNext<T extends Row>(rows: T[], now: Date): { row: T; current: boolean; after: T | null } | null {
  const open = rows.filter((r) => OPEN.includes(r.status) && r.endsAt > now);
  const row = open[0];
  if (!row) return null;
  return { row, current: row.startsAt <= now, after: open[1] ?? null };
}

/** "em 20 min", "em 2h05", "agora"; null quando já começou. */
export function untilLabel(start: Date, now: Date): string {
  const min = Math.round((start.getTime() - now.getTime()) / 60_000);
  if (min <= 0) return "agora";
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `em ${h}h${String(m).padStart(2, "0")}` : `em ${h}h`;
}

/** Confirmações do dia: dos que ainda vão acontecer ou já foram, quantos a cliente confirmou. */
export function confirmations(rows: { status: Status }[]) {
  const counted = rows.filter((r) => r.status !== "no_show");
  const confirmed = counted.filter((r) => r.status === "confirmed" || r.status === "done").length;
  const waiting = counted.filter((r) => r.status === "pending_confirmation").length;
  const reschedule = counted.filter((r) => r.status === "reschedule_requested").length;
  return { total: counted.length, confirmed, waiting, reschedule };
}

/** Variação em % de `cur` sobre `prev`; null sem base para comparar. */
export function deltaPct(cur: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Mesmo dia do mês anterior (limitado ao último dia dele): base justa para comparar o mês até hoje. */
export function sameDayPrevMonth(date: string): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  return `${py}-${String(pm).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}
