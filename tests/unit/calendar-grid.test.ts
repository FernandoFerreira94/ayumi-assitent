import { describe, expect, it } from "vitest";
import { isDateStr } from "@/lib/dates";
import { lastDayOf, monthWeeks, parseView, shiftMonth, weekStart } from "@/features/calendar/grid";
import { spreadByDay, weekDrop } from "@/features/calendar/week";

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
  it("semana começa no domingo, mesmo virando mês e ano", () => {
    expect(weekStart("2026-11-16")).toBe("2026-11-15");
    expect(weekStart("2026-11-15")).toBe("2026-11-15");
    expect(weekStart("2027-01-01")).toBe("2026-12-27");
  });
  it("?v=semana abre a semana que contém d (padrão: hoje)", () => {
    const today = "2026-11-18";
    expect(parseView({ v: "semana", d: "2026-11-21" }, today, isDateStr)).toEqual({ kind: "week", date: "2026-11-15" });
    expect(parseView({ v: "semana" }, today, isDateStr)).toEqual({ kind: "week", date: "2026-11-15" });
    expect(parseView({ v: "semana", d: "lixo" }, today, isDateStr)).toEqual({ kind: "week", date: "2026-11-15" });
  });
});

describe("spreadByDay", () => {
  const at = (iso: string, id: string) => ({ id, startsAt: new Date(iso) });
  const days = ["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"];
  it("põe cada item no dia do estúdio (fuso de São Paulo)", () => {
    const cols = spreadByDay(
      [at("2026-11-16T12:00:00-03:00", "a"), at("2026-11-17T01:30:00Z", "b"), at("2026-11-21T20:00:00-03:00", "c")],
      days,
    );
    expect(cols.map((c) => c.map((r) => r.id))).toEqual([[], ["a", "b"], [], [], [], [], ["c"]]);
  });
  it("ignora o que cai fora da semana", () => {
    expect(spreadByDay([at("2026-11-22T10:00:00-03:00", "x")], days).flat()).toEqual([]);
  });
});

describe("weekDrop", () => {
  const win = { start: 6 * 60, end: 23 * 60 };
  const from = { start: 10 * 60, end: 11 * 60 };
  it("muda de dia pela coluna e de horário pela altura, de 15 em 15", () => {
    // coluna de 100 px, 56 px por hora: +240 px = 2 dias, +60 px ≈ 64 min → 1h
    expect(weekDrop({ fromCol: 1, from, dx: 240, dy: 60, colWidth: 100, pxPerMin: 56 / 60, win })).toEqual({
      col: 3,
      span: { start: 11 * 60, end: 12 * 60 },
    });
  });
  it("não sai da semana nem da janela", () => {
    expect(weekDrop({ fromCol: 5, from, dx: 900, dy: -2000, colWidth: 100, pxPerMin: 1, win })).toEqual({
      col: 6,
      span: { start: 6 * 60, end: 7 * 60 },
    });
    expect(weekDrop({ fromCol: 1, from, dx: -900, dy: 0, colWidth: 100, pxPerMin: 1, win }).col).toBe(0);
  });
  it("metade da coluna ainda é o mesmo dia", () => {
    expect(weekDrop({ fromCol: 2, from, dx: 49, dy: 0, colWidth: 100, pxPerMin: 1, win }).col).toBe(2);
  });
});
