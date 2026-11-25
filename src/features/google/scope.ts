/**
 * Escopo da agenda que o app pede no login e ao ligar o Google (src/lib/auth.ts). `calendar.events` basta para tudo
 * o que o app faz (só calendars/primary/events: listar, criar, atualizar e apagar) e é o mínimo para a verificação.
 */
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

/** Escopo total, pedido antes desta troca. Quem já autorizou com ele continua conectado. */
export const LEGACY_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export const CONTACTS_SCOPE = "https://www.googleapis.com/auth/contacts.readonly";

const CALENDAR_SCOPES = new Set([CALENDAR_SCOPE, LEGACY_CALENDAR_SCOPE]);

/**
 * A tela de aceite do Google deixa desmarcar a caixa da agenda: a conta liga, mas sem acesso ao calendário.
 * `scope` vem da coluna `account.scope` do Better Auth (separado por espaço ou vírgula). Sem o registro do escopo
 * (contas antigas) não dá para provar o contrário, então vale como concedido, como era antes desta checagem.
 */
export function hasCalendarScope(scope: string | null | undefined): boolean {
  if (!scope?.trim()) return true;
  return scope.split(/[\s,]+/).some((s) => CALENDAR_SCOPES.has(s));
}
