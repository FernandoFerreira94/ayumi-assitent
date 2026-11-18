import { describe, expect, it } from "vitest";
import { applyClientFilter, statsLine, type Stats } from "@/features/clients/filters";

const now = new Date("2026-11-18T12:00:00Z");
const ago = (d: number) => new Date(now.getTime() - d * 86_400_000);
const rows = [
  { id: "a", createdAt: ago(400) },
  { id: "b", createdAt: ago(200) },
  { id: "c", createdAt: ago(10) },
  { id: "d", createdAt: ago(90) },
];
const stats = new Map<string, Stats>([
  ["a", { visits: 9, lastVisit: ago(70), spentCents: 90000, hasNext: false }],
  ["b", { visits: 3, lastVisit: ago(120), spentCents: 30000, hasNext: true }],
  ["c", { visits: 1, lastVisit: ago(5), spentCents: 5000, hasNext: false }],
  ["d", { visits: 2, lastVisit: ago(100), spentCents: 8000, hasNext: false }],
]);

describe("applyClientFilter", () => {
  it("sumidas: 60+ dias sem vir e sem horário marcado, a mais antiga primeiro", () => {
    expect(applyClientFilter(rows, stats, "sumidas", now).map((r) => r.id)).toEqual(["d", "a"]);
  });
  it("novas: cadastro nos últimos 30 dias", () => {
    expect(applyClientFilter(rows, stats, "novas", now).map((r) => r.id)).toEqual(["c"]);
  });
  it("mais fiéis: mais visitas primeiro", () => {
    expect(applyClientFilter(rows, stats, "fieis", now).map((r) => r.id)).toEqual(["a", "b", "d", "c"]);
  });
});

describe("statsLine", () => {
  it("resume visitas e última vinda", () => {
    expect(statsLine(stats.get("a"), now)).toBe("9 visitas · última há 70 dias");
    expect(statsLine(undefined, now)).toBe("Ainda não veio");
    expect(statsLine({ visits: 0, lastVisit: null, spentCents: 0, hasNext: true }, now)).toBe("Primeira visita marcada");
  });
});
