import { mapsUrl } from "@/features/salon/address";
import { addDays, formatBRL, formatTime, todayStr } from "@/lib/dates";

/**
 * Textos que o Bubbly manda pelo WhatsApp: ao agendar, no 1º aviso e no 2º aviso. A dona edita os três em
 * Ajustes; as {chaves} viram os dados do horário. Arquivo sem banco para a prévia em Ajustes rodar no navegador.
 */

/** Mensagem de agendamento confirmado (sai ao criar o agendamento). Sem endereço cadastrado, as linhas 📍/🗺️ somem. */
export const DEFAULT_BOOKING =
  "Oi! Seu agendamento de {servico} está confirmado 💜\n📅 {dia}\n🕒 {hora}\n📍 {endereco}\n🗺️ {mapa}\n\nTe esperamos com carinho!";
/** 1º aviso: pede a confirmação do horário. */
export const DEFAULT_REMINDER =
  "Oi! Passando para lembrar do seu horário de {servico} {dia} às {hora}. Te espero com carinho! 💜";
/** 2º aviso para quem ainda não confirmou (vai com as opções 1/2/3). */
export const DEFAULT_SECOND =
  "Oi! Passando para lembrar do seu horário de {servico} {dia} às {hora} 😊 Pode me confirmar?";
/** 2º aviso para quem já confirmou: só lembra, sem pedir resposta. */
export const DEFAULT_SECOND_CONFIRMED =
  "Oi! Passando para lembrar do seu horário de {servico} {dia} às {hora} 😊 Te espero com carinho! 💜";

export const TEMPLATE_MAX = 600;
export const REMINDER_VARS = ["nome", "servico", "dia", "hora", "valor", "salao", "endereco", "mapa"] as const;
type Var = (typeof REMINDER_VARS)[number];

/** Opções que vão sempre no fim dos avisos: é por elas que o webhook entende a resposta (messaging/replies.ts). */
export const OPTIONS = ["", "Responda com o número:", "1 - Confirmo", "2 - Cancelar", "3 - Reagendar"];

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

/** "amanhã às 14:00" ou "dia 20/11 às 09:30": o horário nas respostas automáticas, sem deixar dúvida. */
export const slotLabel = (startsAt: Date, now: Date) => `${dayWord(startsAt, now)} às ${formatTime(startsAt)}`;

export type MessageData = {
  client: string;
  service: string;
  startsAt: Date;
  priceCents?: number | null;
  /** Link do convite (.ics) para a cliente salvar na agenda; só na mensagem de agendamento */
  calendarUrl?: string | null;
  /** Sinal pedido ao agendar (centavos) e a chave Pix do salão; só na mensagem de agendamento */
  deposit?: { cents: number; pixKey?: string | null } | null;
};
export type SalonMessageOpts = {
  template?: string | null;
  name?: string | null;
  fullName?: boolean;
  /** Linha pronta do endereço do estúdio (Ajustes > Endereço); vazio = {endereco} e {mapa} somem */
  address?: string | null;
};

/** Sem endereço cadastrado, a linha que só tinha {endereco}/{mapa} (e emoji/pontuação) sai inteira. */
function dropEmptyAddressLines(template: string, address: string): string {
  if (address) return template;
  return template
    .split("\n")
    .filter((l) => !/\{(endereco|mapa)\}/.test(l) || /[\p{L}\p{N}]/u.test(l.replace(/\{(endereco|mapa)\}/g, "")))
    .join("\n");
}

function fill(rawTemplate: string, a: MessageData, salon: SalonMessageOpts, day: string): string {
  const address = salon.address?.trim() || "";
  const template = dropEmptyAddressLines(rawTemplate, address);
  const values: Record<Var, string> = {
    nome: clientCall(a.client, salon.fullName),
    servico: a.service,
    dia: day,
    hora: formatTime(a.startsAt),
    valor: a.priceCents == null ? "" : formatBRL(a.priceCents),
    salao: salon.name?.trim() || "",
    endereco: address,
    mapa: address ? mapsUrl(address) : "",
  };
  return template
    .replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? values[key as Var] : whole))
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/** Pedido do sinal: valor e Pix. Vai sempre (mesmo com texto editado), antes do link do convite. */
export function depositLines(cents: number, pixKey?: string | null): string {
  const pix = pixKey?.trim();
  return [
    `Para garantir o seu horário, o sinal é de ${formatBRL(cents)}.`,
    pix ? `Pix: ${pix}` : null,
    "Me manda o comprovante por aqui 😊",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Linha do convite: vai no fim, ou onde a dona puser {agenda}. */
export const calendarLine = (url: string) => `📲 Salve na sua agenda: ${url}`;

/**
 * Mensagem de agendamento confirmado. Não pede resposta: quem pergunta são os avisos. Com link do convite,
 * a linha "Salve na sua agenda" vai no lugar de {agenda} ou, sem a chave, no fim (vale para textos já editados).
 */
export function bookingText(a: MessageData, now: Date, salon: SalonMessageOpts = {}): string {
  const base = salon.template?.trim() || DEFAULT_BOOKING;
  const template = a.deposit?.cents ? `${base}\n\n${depositLines(a.deposit.cents, a.deposit.pixKey)}` : base;
  const line = a.calendarUrl ? calendarLine(a.calendarUrl) : "";
  const withLink = template.includes("{agenda}")
    ? template.replace(/\{agenda\}/g, line)
    : line
      ? `${template}\n\n${line}`
      : template;
  return fill(withLink, a, salon, dayLabel(a.startsAt, now)).replace(/\n{3,}/g, "\n\n");
}

/** 1º aviso. As opções 1/2/3 vão sempre no fim, mesmo com texto personalizado. */
export function reminderText(a: MessageData, now: Date, salon: SalonMessageOpts = {}): string {
  const body = fill(salon.template?.trim() || DEFAULT_REMINDER, a, salon, dayWord(a.startsAt, now));
  return [body, ...OPTIONS].join("\n");
}

/**
 * 2º aviso: lembrete perto do horário. Quem ainda não confirmou recebe as opções 1/2/3 no fim; quem já
 * confirmou recebe só o lembrete (com o padrão do app, sem o "Pode me confirmar?"). Nunca cancela sozinho.
 */
export function secondReminderText(
  a: MessageData,
  now: Date,
  salon: SalonMessageOpts = {},
  confirmed = false,
): string {
  const custom = salon.template?.trim();
  const usesDefault = !custom || custom === DEFAULT_SECOND;
  const template = confirmed && usesDefault ? DEFAULT_SECOND_CONFIRMED : custom || DEFAULT_SECOND;
  const body = fill(template, a, salon, dayWord(a.startsAt, now));
  return confirmed ? body : [body, ...OPTIONS].join("\n");
}

/** Aviso de remarcação (sai quando a dona muda o dia/horário). Sem endereço cadastrado, a linha 📍 some. */
export const DEFAULT_RESCHEDULE =
  "Oi! Seu horário de {servico} foi remarcado 💜\n📅 {dia}\n🕒 {hora}\n📍 {endereco}\n\nQualquer dúvida, é só me chamar!";

/** Linha do convite no aviso de remarcação: o mesmo link atualiza o evento que a cliente já salvou. */
export const calendarUpdateLine = (url: string) => `📲 Atualize na sua agenda: ${url}`;

/**
 * Aviso de remarcação. Não pede resposta (o lembrete do horário novo pede). O link do convite vai no lugar de
 * {agenda} ou no fim, como na mensagem de agendamento.
 */
export function rescheduleText(a: MessageData, now: Date, salon: SalonMessageOpts = {}): string {
  const template = salon.template?.trim() || DEFAULT_RESCHEDULE;
  const line = a.calendarUrl ? calendarUpdateLine(a.calendarUrl) : "";
  const withLink = template.includes("{agenda}")
    ? template.replace(/\{agenda\}/g, line)
    : line
      ? `${template}\n\n${line}`
      : template;
  return fill(withLink, a, salon, dayLabel(a.startsAt, now)).replace(/\n{3,}/g, "\n\n");
}
