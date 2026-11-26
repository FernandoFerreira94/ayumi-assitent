import { formatBRL } from "@/lib/dates";

/** Fatos de hoje que o Painel busca para a Bolha (ver `loadMascotFacts`). */
export type MascotFacts = {
  monthReceivedCents: number;
  /** Horários livres hoje para o serviço de Vagas; null quando o dia está fechado ou não há serviço em Vagas. */
  freeToday: string[] | null;
  tomorrowCount: number;
};

/** Quando a dona escondeu os valores (olhinho), a Bolha também não fala os números de dinheiro. */
const MASKED = "R$ •••••";

/**
 * Falas de dinheiro do dia. `hidden` vem do olhinho dos ganhos: escondido, os valores saem mascarados para
 * ninguém ao lado ler na tela.
 */
export function moneyLines(
  { isToday, receivedCents, forecastCents, monthReceivedCents }: {
    isToday: boolean;
    receivedCents: number;
    forecastCents: number;
    monthReceivedCents?: number;
  },
  hidden: boolean,
): string[] {
  const money = (c: number) => (hidden ? MASKED : formatBRL(c));
  const missing = Math.max(forecastCents - receivedCents, 0);
  const out: string[] = [];
  if (!isToday) {
    if (forecastCents > 0) out.push(`Nesse dia entrou ${money(receivedCents)} de ${money(forecastCents)} previstos.`);
    return out;
  }
  if (receivedCents > 0) out.push(`Hoje já entrou ${money(receivedCents)} no caixa!`);
  if (missing > 0) out.push(`Ainda falta entrar ${money(missing)} hoje.`);
  if (monthReceivedCents && monthReceivedCents > 0) out.push(`No mês você já recebeu ${money(monthReceivedCents)}.`);
  return out;
}

/** Falas de agenda que vêm de fora do dia: vagas livres de hoje e o movimento de amanhã. */
export function agendaLines(facts: MascotFacts): string[] {
  const out: string[] = [];
  const free = facts.freeToday;
  if (free && free.length > 0) {
    out.push(
      free.length === 1
        ? `Sobrou 1 horário livre hoje, às ${free[0]}.`
        : `Ainda tem ${free.length} horários livres hoje. O primeiro é às ${free[0]}.`,
    );
  } else if (free) {
    out.push("Agenda de hoje sem horário livre. Arrasou!");
  }
  out.push(
    facts.tomorrowCount === 0
      ? "Amanhã ainda está livre por enquanto."
      : `Amanhã você tem ${facts.tomorrowCount} ${facts.tomorrowCount === 1 ? "atendimento" : "atendimentos"}.`,
  );
  return out;
}

/**
 * Ordem das falas: o resumo do dia sempre primeiro e depois um assunto por toque (agenda, clima, dinheiro…),
 * para cada clique trazer algo diferente em vez de várias falas do mesmo assunto em seguida.
 */
export function rotation(summary: string | undefined, groups: string[][]): string[] {
  const out = summary === undefined ? [] : [summary];
  const longest = Math.max(0, ...groups.map((g) => g.length));
  for (let i = 0; i < longest; i++) for (const g of groups) if (g[i] !== undefined) out.push(g[i]);
  return out;
}

/** Números, horas e valores da fala, para o balão pôr em destaque. */
export const HIGHLIGHT = /(R\$\s?[\d.,•]+|\d{1,2}:\d{2}|-?\d+(?:[.,]\d+)?\s?°C?|\d+%|\d+)/;
