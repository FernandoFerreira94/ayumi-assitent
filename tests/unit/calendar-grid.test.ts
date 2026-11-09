import { describe, expect, it } from "vitest";
import { isDateStr } from "@/lib/dates";
import { lastDayOf, monthWeeks, parseView, shiftMonth } from "@/features/calendar/grid";

describe("grade do calendário", () => {
  it("novembro de 2026 começa no domingo e tem 5 semanas", () => {
    const weeks = monthWeeks("2026-11");
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toBe("2026-11-01");
    expect(weeks[4]).toEqual(["2026-11-29", "2026-11-30", null, null, null, null, null]);
  });
  it("dias antes do dia 1 ficam em branco", () => {
    expect(monthWeeks("2026-01")[0]).toEqual([null, null, null, null, "2026-01-01", "2026-01-02", "2026-01-03"]);
  });
  it("último dia e mês vizinho", () => {
    expect(lastDayOf("2026-02")).toBe("2026-02-28");
    expect(lastDayOf("2026-12")).toBe("2026-12-31");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
  it("lê a visão da URL, com hoje como padrão", () => {
    const today = "2026-11-08";
    expect(parseView({}, today, isDateStr)).toEqual({ kind: "month", month: today.slice(0, 7) });
    expect(parseView({ d: "2026-03-01" }, today, isDateStr)).toEqual({ kind: "day", date: "2026-03-01" });
    expect(parseView({ v: "mes", m: "2027-03" }, today, isDateStr)).toEqual({ kind: "month", month: "2027-03" });
    expect(parseView({ v: "mes", m: "lixo" }, today, isDateStr)).toEqual({ kind: "month", month: "2026-11" });
    expect(parseView({ v: "ano" }, today, isDateStr)).toEqual({ kind: "year", year: "2026" });
  });
});
