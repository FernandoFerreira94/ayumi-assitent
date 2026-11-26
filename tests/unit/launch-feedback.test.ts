// tests/unit/launch-feedback.test.ts
import { describe, expect, it } from "vitest";
import { feedbackInput, shouldAskFeedback, summarizeFeedback, type FeedbackRow } from "@/features/launch/feedback";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-12-10T12:00:00-03:00");

describe("shouldAskFeedback", () => {
  it("não aparece antes de 7 dias de estúdio", () => {
    expect(shouldAskFeedback(new Date(now.getTime() - 6 * day), now, false)).toBe(false);
  });

  it("aparece com 7 dias ou mais", () => {
    expect(shouldAskFeedback(new Date(now.getTime() - 7 * day), now, false)).toBe(true);
    expect(shouldAskFeedback(new Date(now.getTime() - 40 * day), now, false)).toBe(true);
  });

  it("não volta para quem já respondeu ou pulou", () => {
    expect(shouldAskFeedback(new Date(now.getTime() - 30 * day), now, true)).toBe(false);
  });
});

describe("feedbackInput", () => {
  it("aceita só a nota e deixa os textos vazios como null", () => {
    expect(feedbackInput.parse({ helps: "  ", missing: "", score: "8" })).toEqual({ helps: null, missing: null, score: 8 });
  });

  it("recusa nota fora de 0 a 10 e texto longo demais", () => {
    expect(feedbackInput.safeParse({ helps: "", missing: "", score: 11 }).success).toBe(false);
    expect(feedbackInput.safeParse({ helps: "", missing: "", score: -1 }).success).toBe(false);
    expect(feedbackInput.safeParse({ helps: "a".repeat(501), missing: "", score: 5 }).success).toBe(false);
  });
});

describe("summarizeFeedback", () => {
  const row = (score: number | null, skipped = false): FeedbackRow => ({
    salon: "Studio",
    helps: null,
    missing: null,
    score,
    skipped,
    createdAt: now,
  });

  it("sem respostas, sem média nem NPS", () => {
    expect(summarizeFeedback([row(null, true)])).toEqual({ answered: 0, skipped: 1, average: null, nps: null });
  });

  it("calcula média e NPS ignorando quem pulou", () => {
    // 2 promotoras (10, 9), 1 neutra (8), 1 detratora (5) → (2 - 1) / 4 = 25
    expect(summarizeFeedback([row(10), row(9), row(8), row(5), row(null, true)])).toEqual({
      answered: 4,
      skipped: 1,
      average: 8,
      nps: 25,
    });
  });
});
