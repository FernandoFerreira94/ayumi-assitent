import type { Actor } from "./permissions";

export type ProfessionalOption = { id: string; label: string };

/** Cookie com a profissional escolhida no filtro da agenda (vale para Painel, Calendário e o "Novo"). */
export const AGENDA_FILTER_COOKIE = "agenda_p";

export type AgendaScope = {
  /** Agenda mostrada; undefined = todas as profissionais do salão. */
  filterId: string | undefined;
  /** Opções do filtro e do agendar; vazio = salão de uma profissional só (ou login de profissional): nada muda na tela. */
  choices: ProfessionalOption[];
  /** Profissional que já vem marcada no agendar. */
  defaultId: string | undefined;
};

/**
 * O que a agenda mostra e quem pode receber o atendimento. Função pura.
 * - Profissional (D5) vê e agenda só na própria agenda: sem filtro nem escolha.
 * - Dona/gerente com 2+ ativas: filtro "Todas / por profissional" e escolha no agendar,
 *   com a do filtro (ou a ligada ao login, ou a primeira) já marcada.
 * - Com uma ativa só: nada muda.
 */
export function agendaScope(actor: Actor, active: ProfessionalOption[], requested?: string | null): AgendaScope {
  if (actor.role === "professional") {
    const own = actor.professionalId ?? undefined;
    return { filterId: own, choices: [], defaultId: own };
  }
  if (active.length < 2) return { filterId: undefined, choices: [], defaultId: undefined };
  const has = (id: string | null | undefined): id is string => !!id && active.some((p) => p.id === id);
  const filterId = has(requested) ? requested : undefined;
  const defaultId = filterId ?? (has(actor.professionalId) ? actor.professionalId : active[0].id);
  return { filterId, choices: active, defaultId };
}

/** Profissional do atendimento novo: a escolhida, se o login pode escolher e ela está entre as opções. */
export function bookingProfessionalId(scope: AgendaScope, picked: unknown): string | undefined {
  if (scope.choices.length === 0) return scope.defaultId;
  return typeof picked === "string" && scope.choices.some((p) => p.id === picked) ? picked : scope.defaultId;
}
