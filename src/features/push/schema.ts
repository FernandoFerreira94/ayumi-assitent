import { z } from "zod";

/** Servidores de push dos navegadores (Apple, Chrome/Android, Firefox, Edge). O servidor faz POST no endpoint. */
const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];

/** Endpoint de push aceito: https e de um servidor conhecido (evita usar o app para chamar endereços internos). */
export function isPushEndpoint(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && PUSH_HOSTS.some((r) => r.test(u.hostname));
  } catch {
    return false;
  }
}

export const subscriptionSchema = z.object({
  endpoint: z.url().max(2048).refine(isPushEndpoint),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
});
