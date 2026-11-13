import { describe, expect, it } from "vitest";
import { CHANGE_LABEL, CURRENT_VERSION, RELEASES, releaseDate, unseenReleases } from "@/features/update/changelog";

const parse = (v: string) => v.split(".").map(Number);
const newer = (a: string, b: string) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

describe("novidades do app", () => {
  it("versões únicas, no formato 1.2.3, da mais nova para a mais antiga", () => {
    const versions = RELEASES.map((r) => r.version);
    expect(new Set(versions).size).toBe(versions.length);
    for (const v of versions) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
    for (let i = 1; i < versions.length; i++) expect(newer(versions[i - 1], versions[i])).toBe(true);
    expect(CURRENT_VERSION).toBe(versions[0]);
  });
  it("toda versão tem data, título e itens com etiqueta conhecida", () => {
    for (const r of RELEASES) {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.title.trim()).not.toBe("");
      expect(r.items.length).toBeGreaterThan(0);
      for (const i of r.items) expect(CHANGE_LABEL[i.kind]).toBeTruthy();
    }
  });
  it("data no formato brasileiro", () => {
    expect(releaseDate("2026-11-12")).toBe("12/11/2026");
  });
  it("o que mudou: só as versões que o aparelho ainda não viu", () => {
    expect(unseenReleases(CURRENT_VERSION)).toEqual([]);
    expect(unseenReleases(RELEASES[2].version)).toEqual(RELEASES.slice(0, 2));
    // Aparelho novo ou versão que saiu da lista: só a atual
    expect(unseenReleases(null)).toEqual([RELEASES[0]]);
    expect(unseenReleases("0.0.1")).toEqual([RELEASES[0]]);
  });
});
