/**
 * Para onde o login leva: dono do produto vai ao /admin; o resto ao Painel. Sem sessão válida volta ao login com
 * `sessao=invalida`, para o proxy apagar o cookie vencido (senão /login → /entrar → /login em laço).
 */
export function landingAfterLogin(isAdmin: boolean | null): "/login?sessao=invalida" | "/admin" | "/agenda" {
  if (isAdmin === null) return "/login?sessao=invalida";
  return isAdmin ? "/admin" : "/agenda";
}
