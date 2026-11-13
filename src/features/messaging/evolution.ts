import { MessagingOfflineError, MessagingRejectedError, MessagingTransientError, type MessagingPort } from "./port";

type Config = { baseUrl: string; apiKey: string; instance: string };

/** Evolution API (WhatsApp). `fetch` injetável para teste. */
export function evolutionMessaging(cfg: Config, fetchImpl: typeof fetch = fetch): MessagingPort {
  return {
    async sendText(toE164, text) {
      // Só número E.164 de verdade (cliente anonimizada guarda "anon:<id>", cujos dígitos não são telefone)
      if (!/^\+\d+$/.test(toE164)) throw new MessagingRejectedError("not_e164");
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
      // 400 = a Evolution recusou o pedido (quase sempre número sem WhatsApp): repetir não muda nada
      if (res.status === 400) throw new MessagingRejectedError("400");
      if (!res.ok) throw new MessagingTransientError(String(res.status));
      // Já saiu: se a resposta vier estranha, perde-se só o id (o eco do webhook vira uma linha a mais)
      let body: { key?: { id?: string } } | null = null;
      try {
        body = await res.json();
      } catch {}
      return { id: body?.key?.id ?? null };
    },
  };
}

/** Porta de uma instância específica (a do estúdio); null se a Evolution não estiver configurada. */
export function messagingForInstance(instance: string, env = process.env): MessagingPort | null {
  const { EVOLUTION_URL, EVOLUTION_API_KEY } = env;
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY) return null;
  return evolutionMessaging({ baseUrl: EVOLUTION_URL, apiKey: EVOLUTION_API_KEY, instance });
}
