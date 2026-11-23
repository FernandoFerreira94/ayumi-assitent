/** Escopo que dá acesso à agenda; é o que o app pede no login e ao ligar o Google (src/lib/auth.ts). */
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

/**
 * A tela de aceite do Google deixa desmarcar a caixa da agenda: a conta liga, mas sem acesso ao calendário.
 * `scope` vem da coluna `account.scope` do Better Auth (separado por espaço ou vírgula). Sem o registro do escopo
 * (contas antigas) não dá para provar o contrário, então vale como concedido, como era antes desta checagem.
 */
export function hasCalendarScope(scope: string | null | undefined): boolean {
  if (!scope?.trim()) return true;
  return scope.split(/[\s,]+/).includes(CALENDAR_SCOPE);
}
