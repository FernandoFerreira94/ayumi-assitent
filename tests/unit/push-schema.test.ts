import { describe, expect, it } from "vitest";
import { pendenciasText } from "@/features/push/core";
import { subscriptionSchema } from "@/features/push/schema";
import { pushFromEnv } from "@/features/push/webpush";

describe("push", () => {
  it("valida assinatura", () => {
    expect(
      subscriptionSchema.safeParse({ endpoint: "https://x.test/a", keys: { p256dh: "a", auth: "b" } }).success,
    ).toBe(true);
    expect(subscriptionSchema.safeParse({ endpoint: "nope", keys: { p256dh: "a", auth: "b" } }).success).toBe(false);
    expect(subscriptionSchema.safeParse({ endpoint: "https://x.test/a" }).success).toBe(false);
  });
  it("texto singular e plural", () => {
    expect(pendenciasText(1)).toBe("Você tem 1 pendência na agenda.");
    expect(pendenciasText(3)).toBe("Você tem 3 pendências na agenda.");
  });
  it("sem VAPID não há cliente", () => {
    expect(pushFromEnv({} as NodeJS.ProcessEnv)).toBeNull();
  });
});
