/**
 * Endereço antigo do Railway (*.up.railway.app) → domínio oficial (BETTER_AUTH_URL).
 * Só páginas: o proxy não roda em /api, então webhook do WhatsApp, calendários assinados e convites .ics
 * continuam respondendo no endereço antigo. Sem BETTER_AUTH_URL, ou já no domínio dele, não faz nada:
 * voltar a variável para o endereço antigo desliga o redirecionamento (rollback).
 */
export function canonicalRedirect(host: string | null, url: URL, env = process.env): URL | null {
  const base = env.BETTER_AUTH_URL;
  if (!base || !host) return null;
  const target = new URL(base);
  const current = host.split(",")[0].trim().toLowerCase();
  if (!current.endsWith(".up.railway.app") || current === target.host) return null;
  return new URL(url.pathname + url.search, target);
}
