import { generateKeyPairSync, createVerify, verify } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  apnsBody,
  fcmMessage,
  nativeEndpoint,
  nativeSubscriptionSchema,
  parseNativeEndpoint,
  safeAppPath,
} from "@/features/push/native-core";
import { fcmFromEnv, parseServiceAccount, serviceJwt } from "@/features/push/fcm";
import { apnsFromEnv, apnsJwt, parseP8 } from "@/features/push/apns";
import { routePush } from "@/features/push/webpush";
import { PushGoneError } from "@/features/push/port";
import { backAction } from "@/features/native/back";

const payload = { title: "Pendências", body: "Você tem 2 pendências na agenda.", url: "/agenda", tag: "pend" };
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
const rsaPem = rsa.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const ecPem = ec.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const sa = { project_id: "bubbly-x", client_email: "push@bubbly-x.iam.gserviceaccount.com", private_key: rsaPem };
const TOKEN = "fGh1_abc:APA91bExample-token_0123456789";

describe("push nativo: endpoint e corpo", () => {
  it("endpoint com prefixo por plataforma e volta", () => {
    expect(nativeEndpoint("android", TOKEN)).toBe(`fcm:${TOKEN}`);
    expect(parseNativeEndpoint(`fcm:${TOKEN}`)).toEqual({ platform: "android", token: TOKEN });
    expect(parseNativeEndpoint("apns:abcdef")).toEqual({ platform: "ios", token: "abcdef" });
    expect(parseNativeEndpoint("https://fcm.googleapis.com/fcm/send/x")).toBeNull();
  });

  it("valida token e plataforma", () => {
    expect(nativeSubscriptionSchema.safeParse({ platform: "android", token: TOKEN }).success).toBe(true);
    expect(nativeSubscriptionSchema.safeParse({ platform: "ios", token: "a".repeat(64) }).success).toBe(true);
    expect(nativeSubscriptionSchema.safeParse({ platform: "ios", token: "../../x/y/z/1234567890" }).success).toBe(
      false,
    );
    expect(nativeSubscriptionSchema.safeParse({ platform: "web", token: TOKEN }).success).toBe(false);
  });

  it("FCM leva canal, ícone, tag e url; APNs leva alert e url fora de aps", () => {
    const m = fcmMessage(TOKEN, payload).message;
    expect(m.token).toBe(TOKEN);
    expect(m.data).toEqual({ url: "/agenda", tag: "pend" });
    expect(m.android.notification).toMatchObject({ channel_id: "avisos", icon: "ic_stat_bubbly", tag: "pend" });
    expect(apnsBody(payload)).toEqual({
      aps: { alert: { title: "Pendências", body: payload.body }, sound: "default", "thread-id": "pend" },
      url: "/agenda",
    });
  });

  it("toque no aviso só abre caminho do próprio app", () => {
    expect(safeAppPath("/agenda?d=2026-11-18")).toBe("/agenda?d=2026-11-18");
    expect(safeAppPath("https://evil.com")).toBe("/painel");
    expect(safeAppPath("//evil.com")).toBe("/painel");
    expect(safeAppPath(undefined)).toBe("/painel");
  });
});

describe("FCM (Android)", () => {
  it("lê a conta de serviço em texto ou base64", () => {
    expect(parseServiceAccount(JSON.stringify(sa))?.project_id).toBe("bubbly-x");
    expect(parseServiceAccount(Buffer.from(JSON.stringify(sa)).toString("base64"))?.client_email).toBe(sa.client_email);
    expect(parseServiceAccount("{}")).toBeNull();
    expect(parseServiceAccount(undefined)).toBeNull();
  });

  it("JWT RS256 válido com escopo do FCM", () => {
    const jwt = serviceJwt(sa, 1_800_000_000);
    const [h, c, s] = jwt.split(".");
    expect(JSON.parse(Buffer.from(c, "base64url").toString())).toMatchObject({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      exp: 1_800_003_600,
    });
    expect(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(rsa.publicKey, Buffer.from(s, "base64url"))).toBe(
      true,
    );
  });

  it("troca o JWT por token (1x) e envia; 404/UNREGISTERED = inscrição morta", async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      calls.push(u);
      if (u.includes("oauth2")) return new Response(JSON.stringify({ access_token: "ya29.x", expires_in: 3600 }));
      const body = JSON.parse(String(init?.body));
      if (body.message.token === "dead")
        return new Response('{"error":{"status":"NOT_FOUND","details":[{"errorCode":"UNREGISTERED"}]}}', {
          status: 404,
        });
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer ya29.x");
      return new Response("{}");
    }) as unknown as typeof fetch;
    const send = fcmFromEnv({ FCM_SERVICE_ACCOUNT: JSON.stringify(sa) } as unknown as NodeJS.ProcessEnv, fetchMock)!;
    await send(TOKEN, payload);
    await send(TOKEN, payload);
    await expect(send("dead", payload)).rejects.toBeInstanceOf(PushGoneError);
    expect(calls.filter((u) => u.includes("oauth2"))).toHaveLength(1);
    expect(calls[1]).toBe("https://fcm.googleapis.com/v1/projects/bubbly-x/messages:send");
  });

  it("sem variável não liga", () => {
    expect(fcmFromEnv({} as unknown as NodeJS.ProcessEnv)).toBeNull();
  });
});

describe("APNs (iPhone)", () => {
  it("lê o .p8 com \\n escrito ou em base64", () => {
    expect(parseP8(ecPem.replace(/\n/g, "\\n"))).toBe(ecPem);
    expect(parseP8(Buffer.from(ecPem).toString("base64"))).toBe(ecPem);
    expect(parseP8("lixo")).toBeNull();
  });

  it("JWT ES256 verificável", () => {
    const jwt = apnsJwt(ecPem, "KEY123", "TEAM456", 1_800_000_000);
    const [h, c, s] = jwt.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "ES256", kid: "KEY123" });
    expect(
      verify(
        "sha256",
        Buffer.from(`${h}.${c}`),
        { key: ec.publicKey, dsaEncoding: "ieee-p1363" },
        Buffer.from(s, "base64url"),
      ),
    ).toBe(true);
  });

  it("envia com tópico do app; 410/BadDeviceToken = morta; sandbox por variável", async () => {
    const seen: { host: string; path: string; headers: Record<string, string> }[] = [];
    const req = vi.fn(async (host: string, path: string, headers: Record<string, string>) => {
      seen.push({ host, path, headers });
      if (path.endsWith("/gone")) return { status: 410, body: '{"reason":"Unregistered"}' };
      if (path.endsWith("/bad")) return { status: 400, body: '{"reason":"BadDeviceToken"}' };
      return { status: 200, body: "" };
    });
    const env = { APNS_KEY: ecPem, APNS_KEY_ID: "K", APPLE_TEAM_ID: "T" } as unknown as NodeJS.ProcessEnv;
    const send = apnsFromEnv(env, req)!;
    await send("abc", payload);
    expect(seen[0]).toMatchObject({ host: "api.push.apple.com", path: "/3/device/abc" });
    expect(seen[0].headers).toMatchObject({
      "apns-topic": "br.app.bubbly",
      "apns-push-type": "alert",
      "apns-collapse-id": "pend",
    });
    await expect(send("gone", payload)).rejects.toBeInstanceOf(PushGoneError);
    await expect(send("bad", payload)).rejects.toBeInstanceOf(PushGoneError);
    const sandbox = apnsFromEnv({ ...env, APNS_SANDBOX: "1" } as unknown as NodeJS.ProcessEnv, req)!;
    await sandbox("abc", payload);
    expect(seen.at(-1)?.host).toBe("api.sandbox.push.apple.com");
    expect(apnsFromEnv({ APNS_KEY: ecPem } as unknown as NodeJS.ProcessEnv)).toBeNull();
  });
});

describe("roteamento do envio", () => {
  const sub = (endpoint: string) => ({ endpoint, p256dh: "native", auth: "native" });
  it("manda cada inscrição pelo canal dela, com o título já ajustado", async () => {
    const web = vi.fn(async () => {});
    const android = vi.fn(async () => {});
    const ios = vi.fn(async () => {});
    const port = routePush({ web, android, ios }, async (_s, p) => ({ ...p, title: `🫧 ${p.title}` }));
    await port.send(sub("https://fcm.googleapis.com/fcm/send/abc"), payload);
    await port.send(sub(`fcm:${TOKEN}`), payload);
    await port.send(sub("apns:abc"), payload);
    expect(web).toHaveBeenCalledTimes(1);
    expect(android).toHaveBeenCalledWith(TOKEN, { ...payload, title: "🫧 Pendências" });
    expect(ios).toHaveBeenCalledWith("abc", expect.objectContaining({ title: "🫧 Pendências" }));
  });

  it("canal desligado vira falha (não apaga a inscrição)", async () => {
    const port = routePush({ web: null, android: null, ios: null }, async (_s, p) => p);
    await expect(port.send(sub("apns:abc"), payload)).rejects.not.toBeInstanceOf(PushGoneError);
  });
});

describe("botão voltar do Android", () => {
  it("fecha folha, senão volta, senão sai", () => {
    expect(backAction(true, true)).toBe("close");
    expect(backAction(true, false)).toBe("close");
    expect(backAction(false, true)).toBe("back");
    expect(backAction(false, false)).toBe("exit");
  });
});
