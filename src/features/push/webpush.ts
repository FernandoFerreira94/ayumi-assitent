import webpush from "web-push";
import { PushGoneError, type PushPort } from "./port";

/** Cliente real (VAPID). Sem as 3 variáveis, devolve null e o envio é pulado. */
export function pushFromEnv(env: NodeJS.ProcessEnv = process.env): PushPort | null {
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return null;
  webpush.setVapidDetails(subject, pub, priv);
  return {
    async send(sub, payload) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          // urgency high: o iPhone entrega na hora mesmo com a tela bloqueada ou em economia de bateria
          { TTL: 6 * 3600, urgency: "high" },
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) throw new PushGoneError();
        throw e;
      }
    },
  };
}
