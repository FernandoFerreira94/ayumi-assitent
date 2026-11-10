import { SEASON_GREETING, seasonOn } from "@/components/brand/season";
import { formatTime, todayStr } from "@/lib/dates";
import type { Status } from "./schema";

export type Briefing = { mood: "neutral" | "happy"; lines: string[] };

type Row = { startsAt: Date; clientName: string; status: Status };

const OPEN: Status[] = ["pending_confirmation", "confirmed"];
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const firstName = (name: string) => name.trim().split(/\s+/)[0];

/**
 * Fala da Bolha no balão: só informação do dia escolhido, nunca dica de uso.
 * O resumo vem primeiro; tocar na Bolha mostra o que mais vale saber (confirmações, último horário).
 */
export function dayBriefing(rows: Row[], now: Date, isToday: boolean): Briefing {
  const active = rows.filter((r) => r.status !== "no_show");
  const done = active.filter((r) => r.status === "done").length;
  const next = active.find((r) => OPEN.includes(r.status) && r.startsAt >= now);
  const atendimentos = plural(active.length, "atendimento", "atendimentos");

  let summary: string;
  let mood: Briefing["mood"] = "neutral";
  if (active.length === 0) {
    summary = isToday ? "Dia livre! Que tal divulgar uma vaga?" : "Nenhum atendimento nesse dia ainda.";
  } else if (!isToday) {
    summary = `Nesse dia você tem ${atendimentos}.`;
  } else if (done === active.length) {
    summary = `Dia encerrado! Você concluiu ${atendimentos}.`;
    mood = "happy";
  } else if (next) {
    summary = `Você tem ${atendimentos} hoje. A próxima é ${firstName(next.clientName)} às ${formatTime(next.startsAt)}.`;
    mood = "happy";
  } else {
    summary = `Os horários de hoje já passaram. Falta fechar ${plural(active.length - done, "atendimento", "atendimentos")}.`;
  }
  // Nos dias de data comemorativa, a Bolha cumprimenta antes do resumo
  const season = isToday ? seasonOn(todayStr(now)) : null;
  const lines = [season ? `${SEASON_GREETING[season]} ${summary}` : summary];
  const unconfirmed = active.filter((r) => r.status === "pending_confirmation" && r.startsAt >= now).length;
  if (unconfirmed > 0) {
    lines.push(
      unconfirmed === 1
        ? "1 cliente ainda não confirmou o horário."
        : `${unconfirmed} clientes ainda não confirmaram o horário.`,
    );
  }
  const last = active.at(-1);
  if (isToday && last && last !== next && last.startsAt >= now) {
    lines.push(`Seu último atendimento hoje é às ${formatTime(last.startsAt)}.`);
  }
  return { mood, lines };
}
