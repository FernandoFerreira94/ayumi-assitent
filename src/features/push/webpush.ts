import { sql } from "drizzle-orm";
import webpush from "web-push";
import { mascotTitle } from "@/components/brand/mascots";
import { getDb } from "@/db/client";
import { PushGoneError, type PushPort, type PushTarget } from "./port";

// Mascote de cada pessoa por 5 min: um lote de avisos não consulta o banco a cada aparelho
const cache = new Map<string, { mascot: string | null; at: number }>();

async function mascotOf(sub: PushTarget): Promise<string | null> {
  if (!sub.userId || !sub.tenantId) return null;
  const key = `${sub.tenantId}:${sub.userId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.mascot;
  const rows = (await getDb().execute(
    sql`select mascot from memberships where tenant_id = ${sub.tenantId} and user_id = ${sub.userId} limit 1`,
  )) as unknown as { mascot: string | null }[];
  const mascot = rows[0]?.mascot ?? null;
  cache.set(key, { mascot, at: Date.now() });
  return mascot;
}

/** Cliente real (VAPID). Sem as 3 variáveis, devolve null e o envio é pulado. */
export function pushFromEnv(env: NodeJS.ProcessEnv = process.env): PushPort | null {
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return null;
  webpush.setVapidDetails(subject, pub, priv);
  return {
    async send(sub, payload) {
      // Todo aviso (pendências, cliente respondeu, não respondeu, avisos do dia) segue o mascote de Meu perfil
      const mascot = await mascotOf(sub).catch(() => null);
      const titled = { ...payload, title: mascotTitle(payload.title, mascot) };
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(titled),
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
