import { describe, expect, it } from "vitest";
import { pendenciasText } from "@/features/push/core";
import { subscriptionSchema } from "@/features/push/schema";
import { pushFromEnv } from "@/features/push/webpush";

describe("push", () => {
  it("valida assinatura", () => {
    const keys = { p256dh: "a", auth: "b" };
    expect(subscriptionSchema.safeParse({ endpoint: "https://web.push.apple.com/abc", keys }).success).toBe(true);
    expect(subscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys }).success).toBe(true);
    expect(subscriptionSchema.safeParse({ endpoint: "nope", keys }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: "https://web.push.apple.com/abc" }).success).toBe(false);
  });
  it("recusa endpoint fora dos servidores de push", () => {
    const keys = { p256dh: "a", auth: "b" };
    expect(subscriptionSchema.safeParse({ endpoint: "https://x.test/a", keys }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: "http://evolution.railway.internal:8080/x", keys }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: "https://169.254.169.254/latest", keys }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: "http://web.push.apple.com/abc", keys }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: "https://web.push.apple.com.evil.test/abc", keys }).success).toBe(false);
  });
  it("texto singular e plural", () => {
    expect(pendenciasText(1)).toBe("Você tem 1 pendência na agenda.");
    expect(pendenciasText(3)).toBe("Você tem 3 pendências na agenda.");
  });
  it("sem VAPID não há cliente", () => {
    expect(pushFromEnv({} as NodeJS.ProcessEnv)).toBeNull();
  });
});
