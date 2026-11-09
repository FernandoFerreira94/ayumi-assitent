import { addDays, formatBRL, formatTime, todayStr } from "@/lib/dates";

const first = (name: string) => name.trim().split(/\s+/)[0];

/** "hoje", "amanhã" ou "terça-feira, dia 10/11", no fuso do estúdio. */
function dayLabel(startsAt: Date, now: Date): string {
  const day = todayStr(startsAt);
  const today = todayStr(now);
  const dm = `${day.slice(8)}/${day.slice(5, 7)}`;
  if (day === today) return `hoje, dia ${dm}`;
  if (day === addDays(today, 1)) return `amanhã, dia ${dm}`;
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(startsAt);
  return `${weekday}, dia ${dm}`;
}

/**
 * Mensagem que sai quando a profissional confirma o agendamento: só diz que deu certo, o dia e o horário
 * (e o valor, se ela ligou em Ajustes). Não pede resposta: quem pergunta é o lembrete.
 */
export function bookingText(
  a: { client: string; service: string; startsAt: Date; priceCents: number },
  now: Date,
  opts: { includePrice: boolean },
): string {
  const lines = [
    `Oi, ${first(a.client)}! Seu agendamento de ${a.service} está confirmado ✅`,
    `📅 ${dayLabel(a.startsAt, now)}`,
    `🕒 ${formatTime(a.startsAt)}`,
  ];
  if (opts.includePrice) lines.push(`💰 ${formatBRL(a.priceCents)}`);
  lines.push("", "Te esperamos! 💜");
  return lines.join("\n");
}
