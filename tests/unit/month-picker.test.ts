import { describe, expect, it } from "vitest";
import { monthHref } from "@/features/appointments/MonthPicker";

describe("seletor de mês", () => {
  it("outro mês abre a agenda no dia 1", () => {
    expect(monthHref(2027, 3, "2026-11-08")).toBe("/agenda?d=2027-03-01");
    expect(monthHref(2026, 1, "2026-11-08")).toBe("/agenda?d=2026-01-01");
  });
  it("o mês corrente volta para hoje", () => {
    expect(monthHref(2026, 11, "2026-11-08")).toBe("/agenda");
  });
});
