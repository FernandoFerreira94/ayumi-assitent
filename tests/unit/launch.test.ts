// tests/unit/launch.test.ts
import { describe, expect, it } from "vitest";
import { LAUNCH_NOTICE, isFounder } from "@/features/launch/launch";

describe("isFounder", () => {
  it("sem data de cobrança, todo estúdio é fundador", () => {
    expect(isFounder(new Date("2027-06-01T12:00:00-03:00"), null)).toBe(true);
  });

  it("estúdio criado antes do início da cobrança é fundador", () => {
    expect(isFounder(new Date("2026-12-20T10:00:00-03:00"), "2027-01-15T00:00:00-03:00")).toBe(true);
  });

  it("estúdio criado no início da cobrança ou depois não é fundador", () => {
    expect(isFounder(new Date("2027-01-15T00:00:00-03:00"), "2027-01-15T00:00:00-03:00")).toBe(false);
    expect(isFounder(new Date("2027-02-01T09:00:00-03:00"), "2027-01-15T00:00:00-03:00")).toBe(false);
  });
});

describe("LAUNCH_NOTICE", () => {
  it("não promete data nem valor enquanto a cobrança não tem data", () => {
    expect(LAUNCH_NOTICE.text).toContain("Nenhuma cobrança está marcada");
    expect(LAUNCH_NOTICE.text).not.toMatch(/R\$\s?\d/);
  });
});
