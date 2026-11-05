/** Lista de e-mails autorizados a entrar (piloto). Vazia = ninguém entra. */
export function parseAllowedEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isEmailAllowed(email: string | null | undefined, raw = process.env.ALLOWED_EMAILS): boolean {
  if (!email) return false;
  return parseAllowedEmails(raw).has(email.trim().toLowerCase());
}
