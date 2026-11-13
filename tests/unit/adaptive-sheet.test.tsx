// tests/unit/adaptive-sheet.test.tsx
import { describe, expect, it } from "vitest";
import { SIDE_PANEL, sheetClass } from "@/components/ui/AdaptiveSheet";

const MOBILE = "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl";

describe("sheetClass", () => {
  it("celular mantém a folha que sobe de baixo", () => {
    expect(sheetClass("bottom", MOBILE, "sheet z-50")).toBe(`sheet z-50 ${MOBILE}`);
  });
  it("tablet e desktop usam o painel lateral e mantêm o que é comum", () => {
    expect(sheetClass("right", MOBILE, "sheet z-50")).toBe(`sheet z-50 ${SIDE_PANEL}`);
    expect(SIDE_PANEL).toContain("right-0");
    expect(SIDE_PANEL).not.toMatch(/\bz-/);
  });
  it("sem classe comum não sobra espaço", () => {
    expect(sheetClass("bottom", MOBILE)).toBe(MOBILE);
  });
});
