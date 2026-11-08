import { describe, expect, it } from "vitest";
import {
  addDays,
  dayRange,
  formatBRL,
  formatMonthYear,
  formatTime,
  greeting,
  isDateStr,
  todayStr,
  toInstant,
} from "@/lib/dates";

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
  it("mês do dia escolhido com inicial maiúscula", () => {
    expect(formatMonthYear("2026-11-08")).toBe("Novembro de 2026");
  });
  it("saudação segue o relógio de SP e usa só o primeiro nome", () => {
    expect(greeting(new Date("2026-11-08T11:00:00Z"), "Ayumi Tanaka")).toBe("Bom dia, Ayumi"); // 08h
    expect(greeting(new Date("2026-11-08T18:00:00Z"), "Ayumi")).toBe("Boa tarde, Ayumi"); // 15h
    expect(greeting(new Date("2026-11-09T01:00:00Z"), null)).toBe("Boa noite"); // 22h
  });
});
