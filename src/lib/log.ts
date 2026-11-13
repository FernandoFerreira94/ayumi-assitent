/** Log estruturado em JSON (uma linha por evento), fácil de filtrar no Railway. Nunca logue senhas, tokens ou texto de mensagens. */
type Level = "debug" | "info" | "warn" | "error";

export function log(level: Level, msg: string, extra: Record<string, unknown> = {}) {
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...extra });
  (level === "error" ? console.error : console.log)(line);
}

/**
 * Só o tipo do erro, sem a mensagem: em caminhos com dado de cliente a mensagem pode trazer telefone ou texto
 * (resposta da Evolution, do modelo). Do Postgres vem o código e a constraint, que bastam para diagnosticar.
 */
export function errCode(e: unknown): { err: string; code?: string; constraint?: string; status?: number } {
  if (!(e instanceof Error)) return { err: typeof e };
  const x = e as Error & { code?: unknown; constraint_name?: unknown; constraint?: unknown; status?: unknown };
  const out: { err: string; code?: string; constraint?: string; status?: number } = { err: e.name };
  if (typeof x.code === "string") out.code = x.code;
  const c = x.constraint_name ?? x.constraint;
  if (typeof c === "string") out.constraint = c;
  if (typeof x.status === "number") out.status = x.status;
  return out;
}

export const errInfo = (e: unknown) =>
  e instanceof Error ? { err: e.message, stack: e.stack?.split("\n").slice(0, 4).join("\n") } : { err: String(e) };

/**
 * Tira segredo de URL antes de logar ou mandar ao Sentry: o token do link do calendário vai no caminho
 * e o do webhook do WhatsApp na query. Quem tem um deles lê a agenda ou forja mensagem. `conversa`/`aviso`
 * levam o id da cliente ou do aviso: não é segredo, mas não precisa sair do app.
 */
export function redactUrl(url: string): string {
  return url
    .replace(/(\/api\/calendar\/)[^/?#]+/g, "$1[token]")
    .replace(/([?&](?:token|secret|conversa|aviso)=)[^&#]*/gi, "$1[redacted]");
}
