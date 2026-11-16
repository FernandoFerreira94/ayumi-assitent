/**
 * Validação do link do Calendário Público do iCloud, sem dependência: roda no servidor e no sheet (aviso na hora).
 */

/**
 * Aceita o link de "Compartilhar Link" do Calendário Público (webcal:// ou https://) e devolve o https.
 * Só iCloud (`*.icloud.com`, caminho `/published/`): o servidor nunca busca um endereço qualquer (SSRF).
 */
export function normalizeIcloudUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s || s.length > 1000) return null;
  let u: URL;
  try {
    u = new URL(s.replace(/^webcals?:\/\//i, "https://"));
  } catch {
    return null;
  }
  if (!isIcloudUrl(u)) return null;
  u.hash = "";
  return u.toString();
}

export function isIcloudUrl(u: URL): boolean {
  return (
    u.protocol === "https:" &&
    !u.username &&
    !u.password &&
    (u.port === "" || u.port === "443") &&
    /^([a-z0-9-]+\.)*icloud\.com$/i.test(u.hostname) &&
    u.pathname.startsWith("/published/")
  );
}
