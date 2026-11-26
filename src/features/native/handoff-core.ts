/**
 * Login do Google no app da loja (casca Capacitor). O Google não deixa entrar dentro da WebView, então:
 *  1. o app cria um segredo (verifier), guarda com ele e abre o navegador do sistema em /api/native-auth/start
 *     levando só o hash do segredo (challenge);
 *  2. o navegador faz o login normal do Google e cai em /api/native-auth/finish, que troca a sessão do navegador
 *     por um código de uso único e volta para o app pelo link br.app.bubbly://auth?code=...;
 *  3. o app manda código + segredo para /api/native-auth/exchange, que confere o segredo e abre a sessão na WebView.
 * Mesmo que outro app pegue o link de volta, sem o segredo (que nunca saiu do Bubbly) o código não vale nada.
 * Regras puras aqui (testáveis); o servidor fica em handoff.ts.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Esquema do link de volta. Mesmo nome do appId (AndroidManifest e Info.plist registram este esquema). */
export const APP_SCHEME = "br.app.bubbly";
export const CHALLENGE_COOKIE = "bubbly_native_challenge";
/** Validade do código de volta: só o tempo de o app abrir e trocar. */
export const CODE_TTL_MS = 2 * 60 * 1000;

const B64URL = /^[A-Za-z0-9_-]+$/;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

/** SHA-256 em base64url tem sempre 43 caracteres. */
export function isChallenge(value: unknown): value is string {
  return typeof value === "string" && value.length === 43 && B64URL.test(value);
}

export function isVerifier(value: unknown): value is string {
  return typeof value === "string" && value.length >= 43 && value.length <= 128 && B64URL.test(value);
}

export function challengeOf(verifier: string): string {
  return sha256(verifier);
}

/** O segredo que o app guardou bate com o hash que foi para o navegador? (comparação em tempo constante) */
export function verifierMatches(verifier: unknown, challenge: unknown): boolean {
  if (!isVerifier(verifier) || !isChallenge(challenge)) return false;
  return timingSafeEqual(Buffer.from(challengeOf(verifier)), Buffer.from(challenge));
}

export function newCode(): string {
  return randomBytes(32).toString("base64url");
}

/** Chave na tabela de verificação do Better Auth: guarda o hash do código, nunca o código. */
export function codeKey(code: string): string {
  return `native-auth:${sha256(code)}`;
}

/** Código de erro vindo do Better Auth/Google, só letras e _ (vai para a URL e para a tela de login). */
export function safeErrorCode(raw: unknown): string {
  return typeof raw === "string" && /^[A-Za-z_]{1,60}$/.test(raw) ? raw : "UNKNOWN";
}

export function returnUrl(result: { code: string } | { error: string }): string {
  const q = "code" in result ? `code=${encodeURIComponent(result.code)}` : `error=${safeErrorCode(result.error)}`;
  return `${APP_SCHEME}://auth?${q}`;
}

/**
 * Ligar o Google Agenda no app da loja (quem entrou com e-mail e senha). Mesmo motivo do login: o Google não abre
 * dentro da WebView. A WebView, já com sessão, pede um token de uso único (3 min) e abre o navegador do sistema em
 * /api/native-auth/link?token=...; lá o token vira uma sessão curta só para o linkSocial, o Google liga a conta no
 * banco e /api/native-auth/linked devolve br.app.bubbly://google?ok=1 (ou ?error=...) e apaga a sessão do navegador.
 * Nada de valor volta pelo link: o vínculo já está gravado, o app só recarrega a tela.
 */
export const LINK_COOKIE = "bubbly_native_link";

export function linkReturnUrl(result: { ok: true } | { error: string }): string {
  return `${APP_SCHEME}://google?${"ok" in result ? "ok=1" : `error=${safeErrorCode(result.error)}`}`;
}

/** Set-Cookie da resposta do Better Auth → cabeçalho Cookie para a próxima chamada interna (só nome=valor). */
export function cookieHeaderFrom(setCookies: string[]): string {
  return setCookies
    .map((c) => c.split(";")[0].trim())
    .filter((pair) => pair.includes("=") && !pair.endsWith("="))
    .join("; ");
}
