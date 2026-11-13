import { describe, expect, it, vi } from "vitest";
import { evolutionMessaging, messagingForInstance } from "@/features/messaging/evolution";
import { MessagingOfflineError, MessagingRejectedError, MessagingTransientError, sendFailReason } from "@/features/messaging/port";

const cfg = { baseUrl: "https://evo.test/", apiKey: "k", instance: "ayumi" };
const res = (status: number) => ({ ok: status < 300, status }) as Response;

describe("Evolution (WhatsApp)", () => {
  it("envia texto com apikey e número só com dígitos, e devolve o id da mensagem", async () => {
    const f = vi.fn().mockResolvedValue({ ...res(201), json: async () => ({ key: { id: "3EB0ABC" } }) });
    expect(await evolutionMessaging(cfg, f as unknown as typeof fetch).sendText("+5511987654321", "oi")).toEqual({ id: "3EB0ABC" });
    // Resposta sem corpo: a mensagem saiu, só fica sem id
    expect(await evolutionMessaging(cfg, vi.fn().mockResolvedValue(res(201)) as unknown as typeof fetch).sendText("+55119", "x")).toEqual({ id: null });
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
    // 400 = número recusado (sem WhatsApp): não é temporário, não vale repetir
    await expect(mk(res(400)).sendText("+55119", "x")).rejects.toBeInstanceOf(MessagingRejectedError);
    const down = evolutionMessaging(cfg, vi.fn().mockRejectedValue(new Error("x")) as unknown as typeof fetch);
    await expect(down.sendText("+55119", "x")).rejects.toBeInstanceOf(MessagingTransientError);
  });
  it("recusa o que não é telefone (cliente anonimizada) sem chamar a Evolution", async () => {
    const f = vi.fn();
    const port = evolutionMessaging({ baseUrl: "https://evo.test", apiKey: "k", instance: "i" }, f as unknown as typeof fetch);
    await expect(port.sendText("anon:5511-aaaa", "x")).rejects.toBeInstanceOf(MessagingRejectedError);
    expect(f).not.toHaveBeenCalled();
  });
  it("sem URL e chave da Evolution não há porta", () => {
    expect(messagingForInstance("studio-a", {} as NodeJS.ProcessEnv)).toBeNull();
    expect(
      messagingForInstance("studio-a", { EVOLUTION_URL: "u", EVOLUTION_API_KEY: "k" } as unknown as NodeJS.ProcessEnv),
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
  it("número conectado: ownerJid (v2) ou instance.owner, e null quando não há", async () => {
    const num = (r: Response) => mk(vi.fn().mockResolvedValue(r)).number("i");
    expect(await num(json(200, [{ ownerJid: "5511987654321@s.whatsapp.net" }]))).toBe("+5511987654321");
    expect(await num(json(200, [{ instance: { owner: "551187654321:12@s.whatsapp.net" } }]))).toBe("+551187654321");
    expect(await num(json(200, []))).toBeNull();
    expect(await num(json(404))).toBeNull();
  });
  it("registra o webhook só para mensagem nova, no formato da v2", async () => {
    const f = vi.fn().mockResolvedValue(json(201));
    await mk(f).setWebhook("studio-x", "https://app.test/api/whatsapp/webhook?token=t");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://evo.test/webhook/set/studio-x");
    expect(JSON.parse(init.body)).toEqual({
      webhook: { enabled: true, url: "https://app.test/api/whatsapp/webhook?token=t", byEvents: false, base64: false, events: ["MESSAGES_UPSERT"] },
    });
    await expect(mk(vi.fn().mockResolvedValue(json(400))).setWebhook("i", "u")).rejects.toBeInstanceOf(WhatsAppAdminError);
  });
  it("nome da instância é estável e fluxo valida o telefone", async () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(instanceName(id)).toBe("studio-123e4567e89b12d3");
    const admin = {
      create: vi.fn(),
      pair: vi.fn().mockResolvedValue({ pairingCode: "XXXX1111" }),
      state: vi.fn(),
      logout: vi.fn(),
      remove: vi.fn(),
      number: vi.fn(),
      setWebhook: vi.fn(),
    };
    expect(await startPairing(admin, id, "123")).toEqual({ ok: false, reason: "phone" });
    expect(admin.create).not.toHaveBeenCalled();
    expect(await startPairing(admin, id, "(11) 98765-4321")).toEqual({
      ok: true,
      instance: "studio-123e4567e89b12d3",
      pairingCode: "XXXX1111",
    });
  });
  it("motivo da falha para log não leva telefone nem texto", () => {
    expect(sendFailReason(new MessagingRejectedError("400"))).toBe("rejected:400");
    expect(sendFailReason(new MessagingOfflineError("401"))).toBe("offline:401");
    expect(sendFailReason(new MessagingTransientError("500"))).toBe("transient:500");
    expect(sendFailReason(new TypeError("+5511987654321"))).toBe("error:TypeError");
  });
});

describe("Evolution admin: apagar instância", () => {
  it("DELETE na instância e 404 conta como apagada", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response);
    await evolutionAdmin({ baseUrl: "https://evo.test", apiKey: "k" }, f as unknown as typeof fetch).remove("studio-x");
    expect(f).toHaveBeenCalledWith("https://evo.test/instance/delete/studio-x", expect.objectContaining({ method: "DELETE" }));
    const bad = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(
      evolutionAdmin({ baseUrl: "https://evo.test", apiKey: "k" }, bad as unknown as typeof fetch).remove("studio-x"),
    ).rejects.toBeInstanceOf(WhatsAppAdminError);
  });
});
