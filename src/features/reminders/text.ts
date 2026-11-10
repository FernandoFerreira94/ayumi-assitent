import { addDays, formatBRL, formatTime, todayStr } from "@/lib/dates";

/**
 * Textos que o Bubbly manda pelo WhatsApp: ao agendar, no 1º aviso e no 2º aviso. A dona edita os três em
 * Ajustes; as {chaves} viram os dados do horário. Arquivo sem banco para a prévia em Ajustes rodar no navegador.
 */

/** Mensagem de agendamento confirmado (sai ao criar o agendamento). */
export const DEFAULT_BOOKING =
  "Oi, {nome}! Seu agendamento de {servico} está confirmado 💜\n📅 {dia}\n🕒 {hora}\n\nTe esperamos com carinho!";
/** 1º aviso: pede a confirmação do horário. */
export const DEFAULT_REMINDER =
  "Oi, {nome}! Passando para lembrar do seu horário de {servico} {dia} às {hora}. Te espero com carinho! 💜";
/** 2º aviso: só para quem não respondeu ao 1º. */
export const DEFAULT_SECOND =
  "Oi, {nome}! Passando para lembrar do seu horário de {servico} {dia} às {hora} 😊 Pode me confirmar?";

export const TEMPLATE_MAX = 600;
export const REMINDER_VARS = ["nome", "servico", "dia", "hora", "valor", "salao"] as const;
type Var = (typeof REMINDER_VARS)[number];

/** Opções que vão sempre no fim dos avisos: é por elas que o webhook entende a resposta (messaging/replies.ts). */
const OPTIONS = ["", "Responda com o número:", "1 - Confirmo", "2 - Cancelar", "3 - Reagendar"];

/** Como a cliente é chamada: só o primeiro nome ("Maria") ou o nome inteiro salvo no contato. */
export function clientCall(name: string, fullName = false): string {
  const n = name.trim().replace(/\s+/g, " ");
  return fullName ? n : n.split(" ")[0];
}

/** "hoje", "amanhã" ou "dia 12/11", no fuso do estúdio (avisos). */
function dayWord(startsAt: Date, now: Date): string {
  const day = todayStr(startsAt);
  const today = todayStr(now);
  if (day === today) return "hoje";
  if (day === addDays(today, 1)) return "amanhã";
  return `dia ${day.slice(8)}/${day.slice(5, 7)}`;
}

/** "amanhã, dia 11/11" ou "quarta-feira, dia 11/11" (mensagem de agendamento). */
function dayLabel(startsAt: Date, now: Date): string {
  const day = todayStr(startsAt);
  const today = todayStr(now);
  const dm = `${day.slice(8)}/${day.slice(5, 7)}`;
  if (day === today) return `hoje, dia ${dm}`;
  if (day === addDays(today, 1)) return `amanhã, dia ${dm}`;
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(startsAt);
  return `${weekday}, dia ${dm}`;
}

export type MessageData = { client: string; service: string; startsAt: Date; priceCents?: number | null };
export type SalonMessageOpts = { template?: string | null; name?: string | null; fullName?: boolean };

function fill(template: string, a: MessageData, salon: SalonMessageOpts, day: string): string {
  const values: Record<Var, string> = {
    nome: clientCall(a.client, salon.fullName),
    servico: a.service,
    dia: day,
    hora: formatTime(a.startsAt),
    valor: a.priceCents == null ? "" : formatBRL(a.priceCents),
    salao: salon.name?.trim() || "",
  };
  return template
    .replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? values[key as Var] : whole))
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/** Mensagem de agendamento confirmado. Não pede resposta: quem pergunta são os avisos. */
export function bookingText(a: MessageData, now: Date, salon: SalonMessageOpts = {}): string {
  return fill(salon.template?.trim() || DEFAULT_BOOKING, a, salon, dayLabel(a.startsAt, now));
}

/** 1º aviso. As opções 1/2/3 vão sempre no fim, mesmo com texto personalizado. */
export function reminderText(a: MessageData, now: Date, salon: SalonMessageOpts = {}): string {
  const body = fill(salon.template?.trim() || DEFAULT_REMINDER, a, salon, dayWord(a.startsAt, now));
  return [body, ...OPTIONS].join("\n");
}

/** 2º aviso, para quem não respondeu ao 1º. Também termina com as opções 1/2/3. Nunca cancela sozinho. */
export function secondReminderText(a: MessageData, now: Date, salon: SalonMessageOpts = {}): string {
  const body = fill(salon.template?.trim() || DEFAULT_SECOND, a, salon, dayWord(a.startsAt, now));
  return [body, ...OPTIONS].join("\n");
}
