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
