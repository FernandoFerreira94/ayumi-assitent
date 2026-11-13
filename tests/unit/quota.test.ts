import { describe, expect, it } from "vitest";
import { AI_TEXT_MAX, clip } from "@/features/messaging/quota";

describe("texto curto para a IA", () => {
  it("corta o que passa do limite e mantém o resto", () => {
    expect(clip("x".repeat(AI_TEXT_MAX + 50), AI_TEXT_MAX)).toHaveLength(AI_TEXT_MAX);
    expect(clip("ok", AI_TEXT_MAX)).toBe("ok");
  });
});
