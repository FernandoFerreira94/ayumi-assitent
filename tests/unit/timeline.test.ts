import { describe, expect, it } from "vitest";
import { duration, freeGaps, hhmm, minuteOf, timelineWindow } from "@/features/appointments/timeline";

const day = { opens: "09:00", closes: "18:00" };
const at = (h: number, m = 0) => h * 60 + m;

describe("duration", () => {
  it("escreve minutos, horas cheias e horas com minutos", () => {
    expect(duration({ start: at(9), end: at(9, 30) })).toBe("30 min");
    expect(duration({ start: at(9), end: at(10) })).toBe("1h");
    expect(duration({ start: at(9), end: at(10, 30) })).toBe("1h30");
    expect(duration({ start: at(9), end: at(11, 5) })).toBe("2h05");
  });
});

describe("timelineWindow", () => {
  it("usa o expediente quando tudo cabe nele", () => {
    expect(timelineWindow(day, [{ start: at(10), end: at(11) }])).toEqual({ start: at(9), end: at(18) });
  });
  it("estica até a hora cheia para mostrar atendimento fora do expediente", () => {
    expect(
      timelineWindow(day, [
        { start: at(7, 30), end: at(8, 30) },
        { start: at(18), end: at(19, 15) },
      ]),
    ).toEqual({
      start: at(7),
      end: at(20),
    });
  });
  it("dia fechado e vazio mostra 09–18", () => expect(timelineWindow(null, [])).toEqual({ start: at(9), end: at(18) }));
});

describe("freeGaps", () => {
  it("acha as lacunas entre os ocupados", () => {
    expect(
      freeGaps(day, [
        { start: at(10), end: at(11) },
        { start: at(15, 30), end: at(18) },
      ]),
    ).toEqual([
      { start: at(9), end: at(10) },
      { start: at(11), end: at(15, 30) },
    ]);
  });
  it("ignora lacuna menor que 30 min", () => {
    expect(freeGaps(day, [{ start: at(9, 20), end: at(18) }])).toEqual([]);
  });
  it("ocupados sobrepostos não abrem lacuna falsa", () => {
    expect(
      freeGaps(day, [
        { start: at(9), end: at(12) },
        { start: at(10), end: at(11) },
        { start: at(12), end: at(18) },
      ]),
    ).toEqual([]);
  });
  it("dia fechado não tem horário livre", () => expect(freeGaps(null, [])).toEqual([]));
});

describe("minuteOf / hhmm", () => {
  it("lê o horário no fuso do estúdio", () => expect(minuteOf(new Date("2026-11-09T13:30:00Z"))).toBe(at(10, 30)));
  it("formata minutos", () => expect(hhmm(at(8, 5))).toBe("08:05"));
});
