import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Segredo do webhook, um por instância (salão), derivado do BETTER_AUTH_SECRET: a Evolution não assina o
 * que manda, então o app só aceita quem conhece a URL daquela instância. O token de um salão não serve
 * para forjar mensagem de outro.
 */
function token(instance: string, env = process.env): string | null {
  const secret = env.BETTER_AUTH_SECRET;
  return secret
    ? createHmac("sha256", secret).update(`whatsapp-webhook:${instance}`).digest("hex").slice(0, 40)
    : null;
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** URL pública que a Evolution chama a cada mensagem da instância; null sem URL pública ou segredo. */
export function webhookUrl(instance: string, env = process.env): string | null {
  const base = env.BETTER_AUTH_URL?.replace(/\/$/, "");
  const t = token(instance, env);
  return base && t ? `${base}/api/whatsapp/webhook?token=${t}` : null;
}

export function isValidWebhookToken(given: string | null, instance: string, env = process.env): boolean {
  const t = token(instance, env);
  return !!t && !!given && same(given, t);
}

/**
 * Token antigo (um só para todas as instâncias). Aceito só até o worker reapontar cada instância para a
 * URL nova (feito ao iniciar); remover no PR seguinte.
 */
export function isLegacyWebhookToken(given: string | null, env = process.env): boolean {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret || !given) return false;
  return same(given, createHmac("sha256", secret).update("whatsapp-webhook").digest("hex").slice(0, 40));
}
