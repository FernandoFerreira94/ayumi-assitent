import { describe, expect, it } from "vitest";
import {
  customConfigSchema,
  filterDaySlots,
  monthDates,
  monthStart,
  monthWeeks,
  resolveDates,
} from "@/features/hours/custom-slots";

describe("lista personalizada de vagas", () => {
  it("calcula o mês com virada de ano", () => {
    expect(monthStart("2026-11-11", 0)).toBe("2026-11-01");
    expect(monthStart("2026-11-11", 2)).toBe("2027-01-01");
    expect(monthDates("2026-02-01")).toHaveLength(28);
  });

  it("agrupa o mês em semanas de segunda a domingo", () => {
    const w = monthWeeks("2026-11-01"); // 1º/11/2026 é domingo
    expect(w[0]).toEqual(["2026-11-01"]);
    expect(w[1][0]).toBe("2026-11-02");
    expect(w.flat()).toHaveLength(30);
  });

  it("mês inteiro não traz dias que já passaram", () => {
    const d = resolveDates({ kind: "month", monthOffset: 0 }, "2026-11-11");
    expect(d[0]).toBe("2026-11-11");
    expect(d[d.length - 1]).toBe("2026-11-30");
  });

  it("semanas escolhidas e dias soltos", () => {
    expect(resolveDates({ kind: "weeks", monthOffset: 1, weeks: [2] }, "2026-11-11")).toEqual([
      "2026-12-07",
      "2026-12-08",
      "2026-12-09",
      "2026-12-10",
      "2026-12-11",
      "2026-12-12",
      "2026-12-13",
    ]);
    expect(resolveDates({ kind: "days", dates: ["2026-11-20", "2026-11-01", "2026-11-20"] }, "2026-11-11")).toEqual([
      "2026-11-20",
    ]);
  });

  it("filtra por dia da semana e turno", () => {
    const slots = ["09:00", "11:30", "12:00", "15:00", "18:00"];
    expect(filterDaySlots("2026-11-12", slots, { weekdays: [], shifts: [] })).toEqual(slots);
    expect(filterDaySlots("2026-11-12", slots, { weekdays: [], shifts: ["morning"] })).toEqual(["09:00", "11:30"]);
    expect(filterDaySlots("2026-11-12", slots, { weekdays: [], shifts: ["afternoon", "evening"] })).toEqual([
      "12:00",
      "15:00",
      "18:00",
    ]);
    expect(filterDaySlots("2026-11-12", slots, { weekdays: [1], shifts: [] })).toEqual([]); // 12/11/2026 é quinta
  });

  it("recusa configuração inválida", () => {
    expect(
      customConfigSchema.safeParse({ serviceId: null, period: { kind: "x" }, weekdays: [], shifts: [] }).success,
    ).toBe(false);
    expect(
      customConfigSchema.safeParse({
        serviceId: null,
        period: { kind: "month", monthOffset: 1 },
        weekdays: [8],
        shifts: [],
      }).success,
    ).toBe(false);
  });
});
