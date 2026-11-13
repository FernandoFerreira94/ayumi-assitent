import { describe, expect, it } from "vitest";
import { isLegacyWebhookToken, isValidWebhookToken, webhookUrl } from "@/features/messaging/webhook-url";
import { createHmac } from "node:crypto";

const env = { BETTER_AUTH_SECRET: "s".repeat(40), BETTER_AUTH_URL: "https://app.test/" } as unknown as NodeJS.ProcessEnv;

describe("webhook do WhatsApp", () => {
  it("cada instância tem o próprio token", () => {
    const url = new URL(webhookUrl("studio-a", env)!);
    expect(url.origin + url.pathname).toBe("https://app.test/api/whatsapp/webhook");
    const t = url.searchParams.get("token");
    expect(isValidWebhookToken(t, "studio-a", env)).toBe(true);
    expect(isValidWebhookToken(t, "studio-b", env)).toBe(false);
    expect(isValidWebhookToken(null, "studio-a", env)).toBe(false);
    expect(isValidWebhookToken("x", "studio-a", env)).toBe(false);
  });
  it("sem segredo não há URL nem token válido", () => {
    expect(webhookUrl("studio-a", {} as NodeJS.ProcessEnv)).toBeNull();
    expect(isValidWebhookToken("abc", "studio-a", {} as NodeJS.ProcessEnv)).toBe(false);
  });
  it("token antigo é reconhecido só como legado", () => {
    const legacy = createHmac("sha256", "s".repeat(40)).update("whatsapp-webhook").digest("hex").slice(0, 40);
    expect(isLegacyWebhookToken(legacy, env)).toBe(true);
    expect(isValidWebhookToken(legacy, "studio-a", env)).toBe(false);
    expect(isLegacyWebhookToken(new URL(webhookUrl("studio-a", env)!).searchParams.get("token"), env)).toBe(false);
  });
});
