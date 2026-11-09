import { describe, expect, it } from "vitest";
import { timeOptions, toHHMM } from "@/lib/time-grid";

describe("timeOptions", () => {
  it("vai de 06:00 a 22:00 de 15 em 15 por padrão", () => {
    const t = timeOptions();
    expect(t[0]).toBe("06:00");
    expect(t.at(-1)).toBe("22:00");
    expect(t).toContain("09:15");
    expect(t).toHaveLength(65);
  });

  it("inclui um horário fora da grade, em ordem", () => {
    const t = timeOptions({ step: 30, include: "09:15" });
    expect(t.indexOf("09:15")).toBe(t.indexOf("09:00") + 1);
  });

  it("não duplica nem aceita lixo em include", () => {
    expect(timeOptions({ include: "09:15" }).filter((x) => x === "09:15")).toHaveLength(1);
    expect(timeOptions({ include: "9h" })).not.toContain("9h");
  });

  it("formata minutos", () => {
    expect(toHHMM(7 * 60 + 5)).toBe("07:05");
  });
});
