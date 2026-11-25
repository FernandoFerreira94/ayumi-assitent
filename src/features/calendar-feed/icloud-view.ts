import { formatShortDate, formatTime, todayStr } from "@/lib/dates";

/** O que a tela sabe de um calendário do iCloud ligado (o link nunca vem para cá). */
export type IcloudCalendarView = {
  id: string;
  name: string | null;
  eventCount: number;
  /** ISO da última leitura que deu certo */
  syncedAt: string | null;
  syncError: "not_found" | "failed" | "too_big" | "not_calendar" | null;
};

/** Texto curto do erro da última leitura de um calendário do iCloud. */
export const ICLOUD_SYNC_ERROR: Record<NonNullable<IcloudCalendarView["syncError"]>, string> = {
  not_found: "Link parou de funcionar. Ligue o Calendário Público de novo e cole o link.",
  failed: "Não deu para ler agora. Tentamos de novo sozinhos.",
  too_big: "Eventos demais neste calendário.",
  not_calendar: "Esse link não é de um calendário.",
};

/** "Lido às 22:58 · 12 eventos" (ou "Lido em 24/11 às 22:58 · …"). Mesma linha para Google e iCloud. */
export function readLine(syncedAt: string | null, count: number | null, now = new Date()): string {
  const events = count == null ? "" : ` · ${count} evento${count === 1 ? "" : "s"} na agenda`;
  if (!syncedAt) return `Ainda não lido${events}`;
  const d = new Date(syncedAt);
  const sameDay = todayStr(d) === todayStr(now);
  const day = sameDay ? "" : ` em ${formatShortDate(todayStr(d))}`;
  return `Lido${day} às ${formatTime(d)}${events}`;
}
