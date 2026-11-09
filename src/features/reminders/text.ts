import { addDays, formatTime, todayStr } from "@/lib/dates";

/** Texto padrão do lembrete; a dona pode trocar em Ajustes. As {chaves} viram os dados do horário. */
export const DEFAULT_REMINDER =
  "Oi, {nome}! Passando para lembrar do seu horário de {servico} {dia} às {hora}. Te espero! 💜";
export const REMINDER_VARS = ["nome", "servico", "dia", "hora", "salao"] as const;

/** "hoje", "amanhã" ou a data, no fuso do estúdio. */
function dayWord(startsAt: Date, now: Date): string {
  const day = todayStr(startsAt);
  const today = todayStr(now);
  if (day === today) return "hoje";
  if (day === addDays(today, 1)) return "amanhã";
  return `dia ${day.slice(8)}/${day.slice(5, 7)}`;
}

/**
 * Lembrete da véspera. As opções 1/2/3 vão sempre no fim, mesmo com texto personalizado:
 * são o que o webhook entende como resposta (ver messaging/replies.ts).
 * Arquivo à parte do núcleo para a prévia em Ajustes usar sem puxar o banco para o navegador.
 */
export function reminderText(
  a: { client: string; service: string; startsAt: Date },
  now: Date,
  salon: { template?: string | null; name?: string | null } = {},
): string {
  const values: Record<(typeof REMINDER_VARS)[number], string> = {
    nome: a.client.trim().split(/\s+/)[0],
    servico: a.service,
    dia: dayWord(a.startsAt, now),
    hora: formatTime(a.startsAt),
    salao: salon.name?.trim() || "",
  };
  const body = (salon.template?.trim() || DEFAULT_REMINDER).replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? values[key as keyof typeof values] : whole,
  );
  return [body, "", "Responda com o número:", "1 - Confirmo", "2 - Cancelar", "3 - Reagendar"].join("\n");
}
