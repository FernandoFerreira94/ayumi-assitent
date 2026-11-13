// Administração de instâncias da Evolution API (criar, parear, estado, sair). `fetch` injetável.
export type WaState = "none" | "connecting" | "open" | "close";

export interface WhatsAppAdmin {
  /** Idempotente: se a instância já existe, segue. */
  create(instance: string): Promise<void>;
  /** Código de pareamento (8 caracteres) para digitar no WhatsApp > Aparelhos conectados. */
  pair(instance: string, phoneE164: string): Promise<{ pairingCode: string; qr: string | null }>;
  state(instance: string): Promise<WaState>;
  logout(instance: string): Promise<void>;
  /** Apaga a instância na Evolution (conta excluída). Já inexistente conta como apagada. */
  remove(instance: string): Promise<void>;
  /** Número conectado na instância em E.164 (+55...); null se não houver ou não der para saber. */
  number(instance: string): Promise<string | null>;
  /** Aponta as mensagens novas da instância para o webhook do app (idempotente). */
  setWebhook(instance: string, url: string): Promise<void>;
}

export class WhatsAppAdminError extends Error {}

type Config = { baseUrl: string; apiKey: string };

export function evolutionAdmin(cfg: Config, fetchImpl: typeof fetch = fetch): WhatsAppAdmin {
  const base = cfg.baseUrl.replace(/\/$/, "");
  async function call(method: string, path: string, body?: unknown): Promise<Response> {
    try {
      return await fetchImpl(`${base}${path}`, {
        method,
        headers: { "Content-Type": "application/json", apikey: cfg.apiKey },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      // "fetch failed" sozinho não diz nada; a causa (URL inválida, DNS, recusa) vem em e.cause
      const cause = (e as { cause?: { message?: string } }).cause?.message ?? (e as Error).message;
      throw new WhatsAppAdminError(`network: ${cause} (${method} ${path.split("?")[0]})`);
    }
  }
  const enc = encodeURIComponent;

  return {
    async create(instance) {
      const res = await call("POST", "/instance/create", {
        instanceName: instance,
        integration: "WHATSAPP-BAILEYS",
        qrcode: false,
      });
      // 403/409 = nome já em uso (instância existente)
      if (!res.ok && res.status !== 403 && res.status !== 409) throw new WhatsAppAdminError(String(res.status));
    },
    async pair(instance, phoneE164) {
      const res = await call("GET", `/instance/connect/${enc(instance)}?number=${phoneE164.replace(/\D/g, "")}`);
      if (!res.ok) throw new WhatsAppAdminError(String(res.status));
      const body = (await res.json()) as { pairingCode?: string | null; code?: string | null };
      if (!body.pairingCode) throw new WhatsAppAdminError("sem código");
      // `code` é o texto do QR da mesma sessão de pareamento (vale para escanear ou para o código)
      return { pairingCode: body.pairingCode, qr: body.code ?? null };
    },
    async state(instance) {
      const res = await call("GET", `/instance/connectionState/${enc(instance)}`);
      if (res.status === 404) return "none";
      if (!res.ok) throw new WhatsAppAdminError(String(res.status));
      const body = (await res.json()) as { instance?: { state?: string }; state?: string };
      const s = body.instance?.state ?? body.state;
      return s === "open" || s === "connecting" || s === "close" ? s : "close";
    },
    async logout(instance) {
      const res = await call("DELETE", `/instance/logout/${enc(instance)}`);
      if (!res.ok && res.status !== 404 && res.status !== 400) throw new WhatsAppAdminError(String(res.status));
    },
    async remove(instance) {
      const res = await call("DELETE", `/instance/delete/${enc(instance)}`);
      if (!res.ok && res.status !== 404 && res.status !== 400) throw new WhatsAppAdminError(String(res.status));
    },
    async number(instance) {
      const res = await call("GET", `/instance/fetchInstances?instanceName=${enc(instance)}`);
      if (!res.ok) return null;
      // v2 traz `ownerJid` na raiz; versões antigas, `instance.owner`. Ex.: "5511987654321@s.whatsapp.net"
      const body = (await res.json()) as unknown;
      const row = (Array.isArray(body) ? body[0] : body) as
        { ownerJid?: string | null; instance?: { owner?: string | null } } | undefined;
      const jid = row?.ownerJid ?? row?.instance?.owner ?? "";
      const digits = jid.split("@")[0]?.split(":")[0]?.replace(/\D/g, "") ?? "";
      return digits ? `+${digits}` : null;
    },
    async setWebhook(instance, url) {
      // Formato da Evolution v2 (2.3.x): config dentro de "webhook"; só o evento de mensagem nova
      const res = await call("POST", `/webhook/set/${enc(instance)}`, {
        webhook: { enabled: true, url, byEvents: false, base64: false, events: ["MESSAGES_UPSERT"] },
      });
      if (!res.ok) throw new WhatsAppAdminError(`webhook ${res.status}`);
    },
  };
}

export function adminFromEnv(env = process.env): WhatsAppAdmin | null {
  const { EVOLUTION_URL, EVOLUTION_API_KEY } = env;
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY) return null;
  return evolutionAdmin({ baseUrl: EVOLUTION_URL, apiKey: EVOLUTION_API_KEY });
}
