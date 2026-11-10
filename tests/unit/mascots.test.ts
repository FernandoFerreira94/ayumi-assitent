import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_MASCOT, isMascotKind, MASCOTS } from "@/components/brand/mascots";

const css = readFileSync("src/components/brand/mascot-themes.css", "utf8");

describe("mascotes e temas de cor", () => {
  it("ids únicos e só letras minúsculas (o script do <head> confia nisso)", () => {
    const ids = MASCOTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+$/);
  });
  it("cada mascote tem o bloco de cores no CSS", () => {
    for (const m of MASCOTS) expect(css).toContain(`[data-mascot="${m.id}"]`);
  });
  it("valida o que vem do banco", () => {
    expect(isMascotKind("mia")).toBe(true);
    expect(isMascotKind("dragao")).toBe(false);
    expect(isMascotKind(DEFAULT_MASCOT)).toBe(true);
  });
});
