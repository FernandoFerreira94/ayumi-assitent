import type { Status } from "@/features/appointments/schema";
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

/** "9h", "10h30": horário curto (vai nos dados, não na frase falada). */
export function spokenTime(d: Date): string {
  const { h, m } = hm(d);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function hm(d: Date) {
  const [h, m] = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(d)
    .split(":");
  return { h: Number(h) % 24, m: Number(m) };
}

const UNITS = [
  "zero",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "catorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta"];

/** 0 a 59 por extenso. `fem`: "uma", "duas" (horas e clientes). */
export function numberWords(n: number, fem = false): string {
  const unit = (u: number) => (fem && u === 1 ? "uma" : fem && u === 2 ? "duas" : UNITS[u]!);
  if (n < 20) return unit(n);
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u ? `${TENS[t]} e ${unit(u)}` : TENS[t]!;
}

/**
 * Horário como se fala: "às nove", "às duas e meia da tarde", "ao meio-dia e quinze".
 * Da manhã fica implícito; tarde e noite são ditas para não confundir.
 */
export function spokenHour(d: Date): string {
  const { h, m } = hm(d);
  const min = m === 0 ? "" : m === 30 ? " e meia" : ` e ${numberWords(m)}`;
  if (h === 12) return `ao meio-dia${min}`;
  if (h === 0) return `à meia-noite${min}`;
  const h12 = h > 12 ? h - 12 : h;
  const period = h >= 18 ? " da noite" : h > 12 ? " da tarde" : "";
  return `${h12 === 1 ? "à" : "às"} ${numberWords(h12, true)}${min}${period}`;
}

/** "daqui a quarenta minutos", "daqui a uma hora e vinte", "agorinha". */
function untilWords(start: Date, now: Date): string {
  const min = Math.round((start.getTime() - now.getTime()) / 60_000);
  if (min <= 1) return "agorinha";
  if (min < 60) return `daqui a ${numberWords(min)} minutos`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  const hours = h === 1 ? "uma hora" : h < 20 ? `${numberWords(h, true)} horas` : `${h} horas`;
  return `daqui a ${hours}${rest ? ` e ${numberWords(rest)}` : ""}`;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || "cliente";
const count = (n: number) => (n < 60 ? numberWords(n, true) : String(n));
const clientes = (n: number) => `${count(n)} ${n === 1 ? "cliente" : "clientes"}`;
/** Valor sem centavos quando redondo: "R$ 130" soa melhor que "R$ 130,00". */
const money = (cents: number) => formatBRL(cents).replace(/\s/g, " ").replace(/,00$/, "");
const service = (s: string) => s.trim().toLowerCase();
const joinE = (parts: string[]) =>
  parts.length < 2 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}`;

function pendingLine(rows: AtalhoRow[]): string {
  const p = rows.filter((r) => r.status === "pending_confirmation");
  if (!p.length) return "";
  if (p.length === 1) return ` Só ${firstName(p[0]!.clientName)} ainda não confirmou.`;
  if (p.length <= 3) return ` ${joinE(p.map((r) => firstName(r.clientName)))} ainda não confirmaram.`;
  return ` ${count(p.length)} ainda não confirmaram.`;
}

/** Agenda do dia, em uma fala corrida. Hoje: só o que ainda vai acontecer. `rows` sem cancelados, em ordem. */
export function falaAgenda(dia: Dia, rows: AtalhoRow[], now = new Date()): string {
  const active = rows.filter((r) => r.status !== "no_show");
  const when = dia === "hoje" ? "hoje" : "amanhã";
  if (!active.length) return `Sua agenda de ${when} está livre, nenhuma cliente marcada.`;
  const ahead = dia === "hoje" ? active.filter((r) => OPEN.includes(r.status) && r.endsAt > now) : active;
  if (!ahead.length) return `Hoje você teve ${clientes(active.length)} e já acabou tudo. Bom descanso!`;
  const items = ahead
    .slice(0, MAX_LISTED)
    .map(
      (r, i) =>
        `${i === 0 ? "" : "depois "}${firstName(r.clientName)} ${spokenHour(r.startsAt)}, ${service(r.serviceName)}`,
    );
  const rest = ahead.length > MAX_LISTED ? `, e mais ${count(ahead.length - MAX_LISTED)} depois disso` : "";
  const intro =
    ahead.length === active.length
      ? `${dia === "hoje" ? "Hoje" : "Amanhã"} você tem ${clientes(active.length)}. Primeiro `
      : `Hoje você tem ${clientes(active.length)} e ${ahead.length === 1 ? "ainda falta uma" : `ainda faltam ${count(ahead.length)}`}. Agora vem `;
  return `${intro}${items.join(", ")}${rest}.${pendingLine(ahead)}`;
}

function dayWord(d: Date, now: Date): string {
  const day = todayStr(d);
  if (day === todayStr(now)) return "hoje";
  if (day === addDays(todayStr(now), 1)) return "amanhã";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long" }).format(d).replace(/-feira$/, "");
}

export const nextOf = <T extends AtalhoRow>(rows: T[], now: Date) =>
  rows.find((r) => OPEN.includes(r.status) && r.endsAt > now) ?? null;

/** Próxima cliente (hoje e os próximos 7 dias). Se já está em atendimento, diz com quem e até quando. */
export function falaProxima(rows: AtalhoRow[], now = new Date()): string {
  const next = nextOf(rows, now);
  if (!next) return "Você não tem nenhuma cliente marcada nos próximos sete dias.";
  const who = firstName(next.clientName);
  if (next.startsAt <= now)
    return `Agora você está com ${who}, ${service(next.serviceName)}, e termina ${spokenHour(next.endsAt)
      .replace(/^à(s)? /, "lá pelas ")
      .replace(/^ao /, "lá pelo ")}.`;
  const when = dayWord(next.startsAt, now);
  const lead =
    when === "hoje"
      ? `${untilWords(next.startsAt, now)}, ${spokenHour(next.startsAt)}`
      : `${when} ${spokenHour(next.startsAt)}`;
  const pending = next.status === "pending_confirmation" ? ` Ela ainda não confirmou.` : "";
  return `Sua próxima cliente é ${who}, ${lead}, para ${service(next.serviceName)}.${pending}`;
}

/** Resumo do dia: quantas, valor previsto e recebido, quem falta confirmar. */
export function falaResumo(dia: Dia, rows: AtalhoRow[]): string {
  const active = rows.filter((r) => r.status !== "no_show");
  const when = dia === "hoje" ? "hoje" : "amanhã";
  if (!active.length) return `Sua agenda de ${when} está livre, nenhuma cliente marcada.`;
  const forecast = active.reduce((s, r) => s + r.priceCents, 0);
  const received = active.filter((r) => r.status === "done").reduce((s, r) => s + r.priceCents, 0);
  const got = dia === "hoje" && received ? ` e ${money(received)} já recebidos` : "";
  return `${dia === "hoje" ? "Hoje" : "Amanhã"} você tem ${clientes(active.length)}, com ${money(forecast)} previstos${got}.${pendingLine(active)}`;
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
