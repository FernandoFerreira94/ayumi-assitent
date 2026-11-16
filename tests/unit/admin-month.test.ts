import { describe, expect, it } from "vitest";
import { parseMonth } from "@/features/admin/month";

const NOW = new Date("2026-11-01T01:00:00Z"); // ainda 31/10 em UTC-3

describe("parseMonth", () => {
  it("aceita mês válido no passado", () => expect(parseMonth("2026-03", NOW)).toBe("2026-03"));
  it("usa o mês de UTC-3 como atual", () => expect(parseMonth(undefined, NOW)).toBe("2026-10"));
  it("futuro, lixo ou array viram o mês atual", () => {
    expect(parseMonth("2026-11", NOW)).toBe("2026-10");
    expect(parseMonth("2026-13", NOW)).toBe("2026-10");
    expect(parseMonth("x'; drop", NOW)).toBe("2026-10");
    expect(parseMonth(["2026-01"], NOW)).toBe("2026-10");
  });
});
