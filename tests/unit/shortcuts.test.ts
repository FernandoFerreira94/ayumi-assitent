// tests/unit/shortcuts.test.ts
import { describe, expect, it } from "vitest";
import { shiftDay, shortcutFor } from "@/lib/shortcuts";

const key = (k: string, extra: Partial<Parameters<typeof shortcutFor>[0]> = {}) =>
  shortcutFor({ key: k, ctrlKey: false, metaKey: false, altKey: false, target: document.body, ...extra });

describe("shortcutFor", () => {
  it.each([
    ["n", "novo"],
    ["N", "novo"],
    ["/", "buscar"],
    ["t", "hoje"],
    ["ArrowLeft", "anterior"],
    ["ArrowRight", "proximo"],
    ["x", null],
  ])("%s → %s", (k, expected) => {
    expect(key(k)).toBe(expected);
  });

  it("não dispara com Ctrl, Cmd ou Alt", () => {
    expect(key("n", { ctrlKey: true })).toBeNull();
    expect(key("n", { metaKey: true })).toBeNull();
    expect(key("n", { altKey: true })).toBeNull();
  });

  it("não dispara enquanto a pessoa digita", () => {
    expect(key("n", { target: document.createElement("input") })).toBeNull();
    expect(key("/", { target: document.createElement("textarea") })).toBeNull();
  });
});

describe("shiftDay", () => {
  it("anda um dia, virando mês e ano", () => {
    expect(shiftDay("2026-11-13", 1)).toBe("2026-11-14");
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
});
