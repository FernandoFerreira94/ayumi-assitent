import { createHash, randomBytes } from "node:crypto";

/** Prefixo fixo: deixa o GitHub, o Sentry e quem lê um print reconhecerem a chave vazada. */
export const TOKEN_PREFIX = "bub_";

/** `bub_` + 32 bytes aleatórios em base64url (43 caracteres). O banco guarda só o hash. */
export const newApiToken = () => `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;

export const hashApiToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Recusa antes de ir ao banco qualquer coisa que não tenha o formato da chave. */
export const isApiTokenShape = (v: string) => /^bub_[A-Za-z0-9_-]{43}$/.test(v);

/** Os 4 últimos caracteres, para a tela mostrar "•••• a9F2" sem guardar a chave. */
export const tokenLast4 = (token: string) => token.slice(-4);

/** Lê `Authorization: Bearer <chave>`. Sem cabeçalho válido: null. */
export function bearerToken(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? "");
  return m && isApiTokenShape(m[1]!) ? m[1]! : null;
}
