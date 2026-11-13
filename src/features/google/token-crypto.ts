import "server-only";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";

/**
 * Tokens do Google no banco ficam cifrados (Better Auth `account.encryptOAuthTokens`, chave = BETTER_AUTH_SECRET).
 * Mesma regra do Better Auth para reconhecer o cifrado (hex ou envelope `$ba$`): linha antiga em texto puro
 * ("ya29...", "1//...") continua funcionando até o próximo login regravar.
 */
const key = () => process.env.BETTER_AUTH_SECRET ?? "";

export const isEncryptedToken = (t: string) => t.startsWith("$ba$") || (t.length % 2 === 0 && /^[0-9a-f]+$/i.test(t));

export async function readToken(stored: string | null): Promise<string | null> {
  if (!stored) return null;
  return isEncryptedToken(stored) ? symmetricDecrypt({ key: key(), data: stored }) : stored;
}

export const writeToken = (plain: string): Promise<string> => symmetricEncrypt({ key: key(), data: plain });
