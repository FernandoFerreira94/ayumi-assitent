import { describe, expect, it } from "vitest";
import { isStepUpFresh, stepUpLockedUntil } from "@/features/admin/step-up-rules";

const now = new Date("2026-11-20T12:00:00Z");
const ago = (min: number) => new Date(now.getTime() - min * 60_000);

describe("step-up", () => {
  it("vale por 7 dias", () => {
    expect(isStepUpFresh(ago(7 * 24 * 60 - 1), now)).toBe(true);
    expect(isStepUpFresh(ago(7 * 24 * 60), now)).toBe(false);
    expect(isStepUpFresh(null, now)).toBe(false);
  });
  it("4 erros não travam; 5 em 15 min travam até 15 min depois do mais recente", () => {
    expect(stepUpLockedUntil([ago(1), ago(2), ago(3), ago(4)], now)).toBeNull();
    const fails = [ago(5), ago(2), ago(3), ago(4), ago(1)];
    expect(stepUpLockedUntil(fails, now)).toEqual(new Date(ago(1).getTime() + 15 * 60_000));
  });
  it("erros antigos (mais de 15 min) não contam", () => {
    expect(stepUpLockedUntil([ago(1), ago(2), ago(3), ago(4), ago(16)], now)).toBeNull();
  });
});
