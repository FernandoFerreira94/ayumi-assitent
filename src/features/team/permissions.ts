/**
 * Quem pode o quê no salão. Função pura: as actions consultam aqui e o RLS continua só por salão,
 * então o isolamento entre profissionais do mesmo salão é regra de app (testada em tests/db).
 *
 * - owner: tudo, inclusive plano/cobrança e excluir o salão.
 * - admin: tudo, menos plano/cobrança e excluir o salão.
 * - professional (D5): edita só a própria agenda (atendimentos, bloqueios, expediente), vê e edita os clientes
 *   do salão, vê só o próprio faturamento; sem serviços, Ajustes do salão, financeiro do salão nem plano.
 */

export const ROLES = ["owner", "admin", "professional"] as const;
export type Role = (typeof ROLES)[number];

export const ACTIONS = [
  /** Atendimento, bloqueio, expediente e listas de vagas de UMA profissional (alvo = a dona da agenda). */
  "agenda.edit",
  "clients.manage",
  "services.manage",
  /** Despesas e números do salão todo. */
  "finance.salon",
  /** Faturamento de uma profissional (alvo = ela). */
  "finance.own",
  /** Ajustes do salão: perfil, WhatsApp, calendários, mensagens, avisos, IA, Google, exportar dados. */
  "salon.settings",
  "billing.manage",
  "salon.delete",
] as const;
export type Action = (typeof ACTIONS)[number];

export type Context = {
  /** Profissional ligada ao login de quem pede (null se o login não atende). */
  ownProfessionalId?: string | null;
  /** Dona do que está sendo mexido; null = salão todo (ex.: feriado). */
  targetProfessionalId?: string | null;
};

/** Login atual, como `requireTenant()` devolve. */
export type Actor = { role: Role; professionalId: string | null };

export function can(role: Role, action: Action, ctx: Context = {}): boolean {
  if (role === "owner") return true;
  if (role === "admin") return action !== "billing.manage" && action !== "salon.delete";
  if (role !== "professional") return false;
  switch (action) {
    case "clients.manage":
      return true;
    case "agenda.edit":
    case "finance.own":
      // Só o que é dela: sem profissional ligada ao login, ou alvo do salão todo/de outra, nega.
      return ctx.ownProfessionalId != null && ctx.targetProfessionalId === ctx.ownProfessionalId;
    default:
      return false;
  }
}

/** `can` para quem chama de uma action: `canAs(await requireTenant(), "salon.settings")`. */
export const canAs = (actor: Actor, action: Action, targetProfessionalId?: string | null) =>
  can(actor.role, action, { ownProfessionalId: actor.professionalId, targetProfessionalId });

/**
 * Agenda que a pessoa mexe quando não escolhe uma: a da profissional dela (papel professional).
 * Owner e admin retornam undefined e seguem a profissional padrão do salão, como sempre foi.
 */
export const ownAgendaId = (actor: Actor): string | undefined =>
  actor.role === "professional" ? (actor.professionalId ?? undefined) : undefined;
