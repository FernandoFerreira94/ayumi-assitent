import type { Status } from "@/features/appointments/schema";
import { untilLabel } from "@/features/dashboard/rules";
import { addDays, formatBRL, todayStr } from "@/lib/dates";

/**
 * Frases que a Siri lê (Atalhos do iPhone). Tudo só de leitura e montado aqui, no servidor: dá para melhorar
 * o texto sem a profissional reinstalar o Atalho. Só o primeiro nome da cliente (a Siri fala alto).
 */

export type Dia = "hoje" | "amanha";

export type AtalhoRow = {
  startsAt: Date;
  endsAt: Date;
  status: Status;
  clientName: string;
  serviceName: string;
  priceCents: number;
};

const OPEN: Status[] = ["pending_confirmation", "confirmed", "reschedule_requested"];
const MAX_LISTED = 6;
const TZ = "America/Sao_Paulo";

export const parseDia = (v: string | null | undefined): Dia | null =>
  v == null || v === "" || v === "hoje" ? "hoje" : v === "amanha" || v === "amanhã" ? "amanha" : null;

/** Data (YYYY-MM-DD) do dia pedido, no fuso do estúdio. */
export const dayOf = (dia: Dia, now = new Date()) => (dia === "hoje" ? todayStr(now) : addDays(todayStr(now), 1));

/** "9h", "10h30": do jeito que a Siri fala bem. */
export function spokenTime(d: Date): string {
  const [h, m] = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(d)
    .split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || "cliente";
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const money = (cents: number) => formatBRL(cents).replace(/\s/g, " ");
const label = (dia: Dia) => (dia === "hoje" ? "Hoje" : "Amanhã");

function unconfirmed(rows: AtalhoRow[]): string {
  const n = rows.filter((r) => r.status === "pending_confirmation").length;
  return n === 0 ? "" : n === 1 ? " 1 ainda não confirmou." : ` ${n} ainda não confirmaram.`;
}

/** Agenda do dia. Hoje: lista só o que ainda vai acontecer. `rows` sem cancelados, em ordem de horário. */
export function falaAgenda(dia: Dia, rows: AtalhoRow[], now = new Date()): string {
  const active = rows.filter((r) => r.status !== "no_show");
  if (!active.length) return `${label(dia)} você não tem clientes na agenda.`;
  const total = `${label(dia)} você tem ${plural(active.length, "cliente", "clientes")}.`;
  const ahead = dia === "hoje" ? active.filter((r) => OPEN.includes(r.status) && r.endsAt > now) : active;
  if (!ahead.length) return `${total} Todos os horários de hoje já passaram.`;
  const intro = ahead.length === active.length ? "" : ahead.length === 1 ? " Falta 1:" : ` Faltam ${ahead.length}:`;
  const list = ahead
    .slice(0, MAX_LISTED)
    .map((r) => `${spokenTime(r.startsAt)} ${firstName(r.clientName)}, ${r.serviceName}`)
    .join(". ");
  const rest = ahead.length > MAX_LISTED ? ` E mais ${ahead.length - MAX_LISTED}.` : "";
  return `${total}${intro} ${list}.${rest}${unconfirmed(ahead)}`;
}

function dayWord(d: Date, now: Date): string {
  const day = todayStr(d);
  if (day === todayStr(now)) return "hoje";
  if (day === addDays(todayStr(now), 1)) return "amanhã";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long" }).format(d);
}

/** Próxima cliente (hoje e os próximos 7 dias). Se já está em atendimento, diz com quem e até quando. */
export const nextOf = <T extends AtalhoRow>(rows: T[], now: Date) =>
  rows.find((r) => OPEN.includes(r.status) && r.endsAt > now) ?? null;

export function falaProxima(rows: AtalhoRow[], now = new Date()): string {
  const next = nextOf(rows, now);
  if (!next) return "Você não tem clientes marcadas nos próximos 7 dias.";
  const who = firstName(next.clientName);
  if (next.startsAt <= now) return `Agora você está com ${who}, ${next.serviceName}, até ${spokenTime(next.endsAt)}.`;
  const when = dayWord(next.startsAt, now);
  const until = when === "hoje" ? `, ${untilLabel(next.startsAt, now).replace(/^em /, "daqui a ")}` : "";
  const pending = next.status === "pending_confirmation" ? " Ela ainda não confirmou." : "";
  return `Sua próxima cliente é ${who}, ${when} às ${spokenTime(next.startsAt)}${until}, ${next.serviceName}.${pending}`;
}

/** Resumo do dia: quantas, confirmadas, valor previsto e já recebido. */
export function falaResumo(dia: Dia, rows: AtalhoRow[]): string {
  const active = rows.filter((r) => r.status !== "no_show");
  if (!active.length) return `${label(dia)} você não tem clientes na agenda.`;
  const forecast = active.reduce((s, r) => s + r.priceCents, 0);
  const received = active.filter((r) => r.status === "done").reduce((s, r) => s + r.priceCents, 0);
  const pending = active.filter((r) => r.status === "pending_confirmation").length;
  const parts = [
    `${label(dia)} você tem ${plural(active.length, "cliente", "clientes")}`,
    `${money(forecast)} previstos`,
  ];
  if (dia === "hoje" && received) parts.push(`${money(received)} já recebidos`);
  if (pending) parts.push(`${pending} sem confirmar`);
  const last = parts.pop()!;
  return `${parts.join(", ")} e ${last}.`;
}

/** Dados que vão junto da frase (para quem quiser montar outro Atalho). Só primeiro nome, sem telefone. */
export const publicRow = (r: AtalhoRow) => ({
  inicio: r.startsAt.toISOString(),
  fim: r.endsAt.toISOString(),
  hora: spokenTime(r.startsAt),
  cliente: firstName(r.clientName),
  servico: r.serviceName,
  status: r.status,
});
