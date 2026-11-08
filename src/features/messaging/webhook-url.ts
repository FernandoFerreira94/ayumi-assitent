import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Segredo do webhook derivado do BETTER_AUTH_SECRET: a Evolution não assina o que manda, então o
 * app só aceita quem conhece esta URL. Derivar evita mais uma variável para configurar no Railway.
 */
function token(env = process.env): string | null {
  const secret = env.BETTER_AUTH_SECRET;
  return secret ? createHmac("sha256", secret).update("whatsapp-webhook").digest("hex").slice(0, 40) : null;
}

/** URL pública que a Evolution chama a cada mensagem; null sem URL pública ou segredo. */
export function webhookUrl(env = process.env): string | null {
  const base = env.BETTER_AUTH_URL?.replace(/\/$/, "");
  const t = token(env);
  return base && t ? `${base}/api/whatsapp/webhook?token=${t}` : null;
}

export function isValidWebhookToken(given: string | null, env = process.env): boolean {
  const t = token(env);
  if (!t || !given || given.length !== t.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(t));
}
