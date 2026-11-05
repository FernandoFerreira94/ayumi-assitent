import { MessagingOfflineError, MessagingTransientError, type MessagingPort } from "./port";

type Config = { baseUrl: string; apiKey: string; instance: string };

/** Evolution API (WhatsApp). `fetch` injetável para teste. */
export function evolutionMessaging(cfg: Config, fetchImpl: typeof fetch = fetch): MessagingPort {
  return {
    async sendText(toE164, text) {
      let res: Response;
      try {
        res = await fetchImpl(
          `${cfg.baseUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(cfg.instance)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: cfg.apiKey },
            body: JSON.stringify({ number: toE164.replace(/\D/g, ""), text }),
          },
        );
      } catch {
        throw new MessagingTransientError("network");
      }
      if (res.status === 401 || res.status === 403 || res.status === 404)
        throw new MessagingOfflineError(String(res.status));
      if (!res.ok) throw new MessagingTransientError(String(res.status));
    },
  };
}

/** Porta configurada pelo ambiente; null enquanto a Evolution não estiver configurada. */
export function messagingFromEnv(env = process.env): MessagingPort | null {
  const { EVOLUTION_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } = env;
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) return null;
  return evolutionMessaging({ baseUrl: EVOLUTION_URL, apiKey: EVOLUTION_API_KEY, instance: EVOLUTION_INSTANCE });
}
