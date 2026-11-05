/** Log estruturado em JSON (uma linha por evento), fácil de filtrar no Railway. Nunca logue senhas, tokens ou texto de mensagens. */
type Level = "debug" | "info" | "warn" | "error";

export function log(level: Level, msg: string, extra: Record<string, unknown> = {}) {
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...extra });
  (level === "error" ? console.error : console.log)(line);
}

export const errInfo = (e: unknown) =>
  e instanceof Error ? { err: e.message, stack: e.stack?.split("\n").slice(0, 4).join("\n") } : { err: String(e) };
