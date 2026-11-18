import "server-only";
import { connect } from "node:http2";
import { sign } from "node:crypto";
import { apnsBody } from "./native-core";
import type { NativeSender } from "./fcm";
import { PushGoneError } from "./port";

export type ApnsRequest = (
  host: string,
  path: string,
  headers: Record<string, string>,
  body: string,
) => Promise<{ status: number; body: string }>;

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

/** APNS_KEY: o conteúdo do .p8 (com quebras reais, "\n" escrito ou em base64). */
export function parseP8(raw: string | undefined): string | null {
  if (!raw) return null;
  const pem = raw.includes("BEGIN PRIVATE KEY")
    ? raw.replace(/\\n/g, "\n")
    : Buffer.from(raw, "base64").toString("utf8");
  return pem.includes("BEGIN PRIVATE KEY") ? pem : null;
}

/** JWT ES256 do APNs (vale 1 h; renovamos a cada 50 min). */
export function apnsJwt(key: string, keyId: string, teamId: string, nowSec: number): string {
  const input = `${b64url(JSON.stringify({ alg: "ES256", kid: keyId }))}.${b64url(JSON.stringify({ iss: teamId, iat: nowSec }))}`;
  const sig = sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" });
  return `${input}.${b64url(sig)}`;
}

const http2Request: ApnsRequest = (host, path, headers, body) =>
  new Promise((resolve, reject) => {
    const client = connect(`https://${host}`);
    client.on("error", reject);
    const req = client.request({ ":method": "POST", ":path": path, ...headers });
    let status = 0;
    let data = "";
    req.on("response", (h) => (status = Number(h[":status"])));
    req.setEncoding("utf8");
    req.on("data", (c: string) => (data += c));
    req.on("end", () => {
      client.close();
      resolve({ status, body: data });
    });
    req.on("error", (e) => {
      client.close();
      reject(e);
    });
    req.setTimeout(10_000, () => req.close());
    req.end(body);
  });

/**
 * Envio para iPhone (APNs com chave .p8). Precisa de APNS_KEY, APNS_KEY_ID e APPLE_TEAM_ID; sem eles, null.
 * APNS_SANDBOX=1 para builds de desenvolvimento (TestFlight e loja usam produção).
 */
export function apnsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  request: ApnsRequest = http2Request,
): NativeSender | null {
  const key = parseP8(env.APNS_KEY);
  const keyId = env.APNS_KEY_ID;
  const teamId = env.APPLE_TEAM_ID;
  if (!key || !keyId || !teamId) return null;
  const host = env.APNS_SANDBOX === "1" ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  const topic = env.APNS_BUNDLE_ID || "br.app.bubbly";
  let cached: { jwt: string; until: number } | null = null;

  return async (token, payload) => {
    const now = Date.now();
    if (!cached || cached.until <= now) {
      cached = { jwt: apnsJwt(key, keyId, teamId, Math.floor(now / 1000)), until: now + 50 * 60_000 };
    }
    const res = await request(
      host,
      `/3/device/${token}`,
      {
        authorization: `bearer ${cached.jwt}`,
        "apns-topic": topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "apns-expiration": String(Math.floor(now / 1000) + 6 * 3600),
        ...(payload.tag ? { "apns-collapse-id": payload.tag.slice(0, 64) } : {}),
        "content-type": "application/json",
      },
      JSON.stringify(apnsBody(payload)),
    );
    if (res.status === 200) return;
    // 410 = app desinstalado; BadDeviceToken/DeviceTokenNotForTopic = token que nunca vai funcionar
    if (res.status === 410 || /BadDeviceToken|DeviceTokenNotForTopic|Unregistered/.test(res.body)) {
      throw new PushGoneError();
    }
    if (res.status === 403) cached = null;
    throw new Error(`apns_${res.status}`);
  };
}
