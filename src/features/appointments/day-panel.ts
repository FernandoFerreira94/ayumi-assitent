import type { Status } from "./schema";

/**
 * Números dos cartões da coluna "Contexto do dia" no Painel (tela larga).
 * Tudo sai das linhas do dia que o Painel já carrega com `listDay`: nenhuma consulta nova.
 */

type MoneyRow = { priceCents: number; status: Status };
type TimedRow = { startsAt: Date; endsAt: Date; status: Status };

const OPEN: Status[] = ["pending_confirmation", "confirmed", "reschedule_requested"];

export type DayForecast = { doneCents: number; confirmedCents: number; waitingCents: number; totalCents: number };

/** Previsão de ganho: concluído, confirmado e o que ainda espera a cliente (confirmar ou remarcar). Falta não conta. */
export function dayForecast(rows: MoneyRow[]): DayForecast {
  const sum = (pick: (s: Status) => boolean) =>
    rows.filter((r) => pick(r.status)).reduce((acc, r) => acc + r.priceCents, 0);
  const doneCents = sum((s) => s === "done");
  const confirmedCents = sum((s) => s === "confirmed");
  const waitingCents = sum((s) => s === "pending_confirmation" || s === "reschedule_requested");
  return { doneCents, confirmedCents, waitingCents, totalCents: doneCents + confirmedCents + waitingCents };
}

/** Próximos: em aberto e que ainda vão começar, na ordem do dia (as linhas já vêm ordenadas). */
export function upcoming<T extends TimedRow>(rows: T[], now: Date, limit = 3): T[] {
  return rows.filter((r) => OPEN.includes(r.status) && r.startsAt >= now).slice(0, limit);
}

export type DayPendencias = { toClose: number; toConfirm: number; toReschedule: number; total: number };

/** Pendências do dia, com as mesmas regras de `listPendencias`, mas só para as linhas do dia. */
export function dayPendencias(rows: TimedRow[], now: Date): DayPendencias {
  const toClose = rows.filter((r) => OPEN.includes(r.status) && r.endsAt < now).length;
  const ahead = rows.filter((r) => r.endsAt >= now);
  const toConfirm = ahead.filter((r) => r.status === "pending_confirmation").length;
  const toReschedule = ahead.filter((r) => r.status === "reschedule_requested").length;
  return { toClose, toConfirm, toReschedule, total: toClose + toConfirm + toReschedule };
}
