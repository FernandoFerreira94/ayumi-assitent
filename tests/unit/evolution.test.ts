import { describe, expect, it, vi } from "vitest";
import { evolutionMessaging, messagingFromEnv } from "@/features/messaging/evolution";
import { MessagingOfflineError, MessagingTransientError } from "@/features/messaging/port";

const cfg = { baseUrl: "https://evo.test/", apiKey: "k", instance: "ayumi" };
const res = (status: number) => ({ ok: status < 300, status }) as Response;

describe("Evolution (WhatsApp)", () => {
  it("envia texto com apikey e número só com dígitos", async () => {
    const f = vi.fn().mockResolvedValue(res(201));
    await evolutionMessaging(cfg, f as unknown as typeof fetch).sendText("+5511987654321", "oi");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://evo.test/message/sendText/ayumi");
    expect(init.headers.apikey).toBe("k");
    expect(JSON.parse(init.body)).toEqual({ number: "5511987654321", text: "oi" });
  });
  it("401/404 = offline; 500 e rede = temporário", async () => {
    const mk = (r: unknown) => evolutionMessaging(cfg, vi.fn().mockResolvedValue(r) as unknown as typeof fetch);
    await expect(mk(res(401)).sendText("+55119", "x")).rejects.toBeInstanceOf(MessagingOfflineError);
    await expect(mk(res(404)).sendText("+55119", "x")).rejects.toBeInstanceOf(MessagingOfflineError);
    await expect(mk(res(500)).sendText("+55119", "x")).rejects.toBeInstanceOf(MessagingTransientError);
    const down = evolutionMessaging(cfg, vi.fn().mockRejectedValue(new Error("x")) as unknown as typeof fetch);
    await expect(down.sendText("+55119", "x")).rejects.toBeInstanceOf(MessagingTransientError);
  });
  it("sem variáveis de ambiente não há porta", () => {
    expect(messagingFromEnv({} as NodeJS.ProcessEnv)).toBeNull();
    expect(
      messagingFromEnv({
        EVOLUTION_URL: "u",
        EVOLUTION_API_KEY: "k",
        EVOLUTION_INSTANCE: "i",
      } as unknown as NodeJS.ProcessEnv),
    ).not.toBeNull();
  });
});

import { evolutionAdmin, WhatsAppAdminError } from "@/features/messaging/evolution-admin";
import { instanceName, startPairing } from "@/features/whatsapp/core";

describe("Evolution admin", () => {
  const json = (status: number, body?: unknown) => ({ ok: status < 300, status, json: async () => body }) as Response;
  const mk = (f: unknown) => evolutionAdmin({ baseUrl: "https://evo.test/", apiKey: "k" }, f as typeof fetch);

  it("cria instância Baileys e tolera nome já em uso", async () => {
    const f = vi.fn().mockResolvedValue(json(403));
    await mk(f).create("studio-x");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://evo.test/instance/create");
    expect(JSON.parse(init.body)).toMatchObject({ instanceName: "studio-x", integration: "WHATSAPP-BAILEYS" });
    await expect(mk(vi.fn().mockResolvedValue(json(500))).create("a")).rejects.toBeInstanceOf(WhatsAppAdminError);
  });
  it("pede o código de pareamento com o número só em dígitos", async () => {
    const f = vi.fn().mockResolvedValue(json(200, { pairingCode: "ABCD1234", code: "2@qr" }));
    expect(await mk(f).pair("i", "+5511987654321")).toEqual({ pairingCode: "ABCD1234", qr: "2@qr" });
    expect(f.mock.calls[0][0]).toBe("https://evo.test/instance/connect/i?number=5511987654321");
    await expect(mk(vi.fn().mockResolvedValue(json(200, {}))).pair("i", "+5511987654321")).rejects.toBeInstanceOf(
      WhatsAppAdminError,
    );
  });
  it("estado: open, connecting, close e none (404)", async () => {
    const st = (r: Response) => mk(vi.fn().mockResolvedValue(r)).state("i");
    expect(await st(json(200, { instance: { state: "open" } }))).toBe("open");
    expect(await st(json(200, { instance: { state: "connecting" } }))).toBe("connecting");
    expect(await st(json(200, { instance: { state: "weird" } }))).toBe("close");
    expect(await st(json(404))).toBe("none");
  });
  it("nome da instância é estável e fluxo valida o telefone", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(instanceName(id)).toBe("studio-123e4567e89b12d3");
    const admin = {
      create: vi.fn(),
      pair: vi.fn().mockResolvedValue({ pairingCode: "XXXX1111" }),
      state: vi.fn(),
      logout: vi.fn(),
    };
    expect(await startPairing(admin, id, "123")).toEqual({ ok: false, reason: "phone" });
    expect(admin.create).not.toHaveBeenCalled();
    expect(await startPairing(admin, id, "(11) 98765-4321")).toEqual({
      ok: true,
      instance: "studio-123e4567e89b12d3",
      pairingCode: "XXXX1111",
    });
  });
});
