import { createHash, randomBytes } from "node:crypto";

/** 32 bytes aleatórios em base64url (43 caracteres). Vai só no link; o banco guarda o hash. */
export const newToken = () => randomBytes(32).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Recusa antes de ir ao banco qualquer coisa que não tenha o formato do token. */
export const isTokenShape = (v: string) => /^[A-Za-z0-9_-]{43}$/.test(v);
