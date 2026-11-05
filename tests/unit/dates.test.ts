import { describe, expect, it } from "vitest";
import { addDays, dayRange, formatBRL, formatTime, isDateStr, todayStr, toInstant } from "@/lib/dates";

describe("datas no fuso do estúdio", () => {
  it("hoje usa o fuso de São Paulo (22h de 10/11 em SP já é 11/11 UTC)", () => {
    expect(todayStr(new Date("2026-11-11T01:30:00Z"))).toBe("2026-11-10");
  });
  it("soma dias atravessando o mês", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("intervalo do dia vai de 00:00 a 00:00 de SP", () => {
    const [a, b] = dayRange("2026-11-10");
    expect(a.toISOString()).toBe("2026-11-10T03:00:00.000Z");
    expect(b.toISOString()).toBe("2026-11-11T03:00:00.000Z");
  });
  it("converte e formata horário", () => {
    expect(formatTime(toInstant("2026-11-10", "14:30"))).toBe("14:30");
  });
  it("valida datas e formata reais", () => {
    expect(isDateStr("2026-11-10")).toBe(true);
    expect(isDateStr("2026-13-40")).toBe(false);
    expect(isDateStr("hoje")).toBe(false);
    expect(formatBRL(15050).replace(/\s/g, " ")).toBe("R$ 150,50");
  });
});
