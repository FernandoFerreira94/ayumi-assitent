import "server-only";
import { createSign } from "node:crypto";
import { fcmMessage } from "./native-core";
import { PushGoneError, type PushPayload } from "./port";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };
export type NativeSender = (token: string, payload: PushPayload) => Promise<void>;

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

/** FCM_SERVICE_ACCOUNT: o JSON da conta de serviço do Firebase (texto puro ou em base64). */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  for (const text of [raw, Buffer.from(raw, "base64").toString("utf8")]) {
    try {
      const j = JSON.parse(text) as Partial<ServiceAccount>;
      if (j.project_id && j.client_email && j.private_key) return j as ServiceAccount;
    } catch {
      /* tenta o próximo formato */
    }
  }
  return null;
}

/** JWT assinado (RS256) que o Google troca por um token de acesso de 1 h. */
export function serviceJwt(sa: ServiceAccount, nowSec: number): string {
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  );
  const sig = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(sa.private_key);
  return `${head}.${claims}.${b64url(sig)}`;
}

/** Envio para Android (FCM HTTP v1). Sem FCM_SERVICE_ACCOUNT, devolve null. */
export function fcmFromEnv(env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): NativeSender | null {
  const sa = parseServiceAccount(env.FCM_SERVICE_ACCOUNT);
  if (!sa) return null;
  let cached: { token: string; until: number } | null = null;

  async function accessToken(): Promise<string> {
    const now = Date.now();
    if (cached && cached.until > now) return cached.token;
    const res = await fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: serviceJwt(sa!, Math.floor(now / 1000)),
      }),
    });
    if (!res.ok) throw new Error(`fcm_auth_${res.status}`);
    const j = (await res.json()) as { access_token: string; expires_in?: number };
    cached = { token: j.access_token, until: now + ((j.expires_in ?? 3600) - 120) * 1000 };
    return j.access_token;
  }

  return async (token, payload) => {
    const res = await fetchImpl(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify(fcmMessage(token, payload)),
    });
    if (res.ok) return;
    const text = await res.text().catch(() => "");
    // Token desinstalado/expirado: o Firebase responde 404 ou UNREGISTERED
    if (res.status === 404 || text.includes("UNREGISTERED")) throw new PushGoneError();
    if (res.status === 401) cached = null;
    throw new Error(`fcm_${res.status}`);
  };
}
