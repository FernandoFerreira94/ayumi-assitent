import { describe, expect, it } from "vitest";
import { pauseHit, pauseOverlap, pauseWarning } from "@/features/appointments/agenda-grid";
import type { Day } from "@/features/hours/slots";

const lunch = { start: 12 * 60, end: 13 * 60 };
const day = { opens: "09:00", closes: "18:00", breakStart: "12:00", breakEnd: "13:00" };
// 2026-11-23 é segunda (1); domingo fechado; sábado sem pausa
const week: Day[] = [null, day, day, day, day, day, { opens: "09:00", closes: "14:00" }];

describe("pauseHit", () => {
  it("encostar no começo ou no fim da pausa não avisa", () => {
    expect(pauseHit({ start: 11 * 60, end: 12 * 60 }, lunch)).toBeNull();
    expect(pauseHit({ start: 13 * 60, end: 14 * 60 }, lunch)).toBeNull();
  });
  it("um minuto dentro já avisa, dos dois lados", () => {
    expect(pauseHit({ start: 11 * 60, end: 12 * 60 + 1 }, lunch)).toEqual(lunch);
    expect(pauseHit({ start: 13 * 60 - 1, end: 14 * 60 }, lunch)).toEqual(lunch);
  });
  it("dentro, cobrindo a pausa inteira e sem pausa", () => {
    expect(pauseHit({ start: 12 * 60 + 15, end: 12 * 60 + 45 }, lunch)).toEqual(lunch);
    expect(pauseHit({ start: 10 * 60, end: 15 * 60 }, lunch)).toEqual(lunch);
    expect(pauseHit({ start: 12 * 60, end: 13 * 60 }, null)).toBeNull();
  });
});

describe("pauseOverlap", () => {
  it("soma a duração de vários serviços até o fim", () => {
    // 11:00 + 45 + 30 = 12:15: invade
    expect(pauseOverlap({ date: "2026-11-23", time: "11:00", minutes: 75, week })).toEqual(lunch);
    // 11:00 + 30 + 30 = 12:00: encosta, não avisa
    expect(pauseOverlap({ date: "2026-11-23", time: "11:00", minutes: 60, week })).toBeNull();
  });
  it("virada de hora: 11:45 por 30 min passa das 12:00", () => {
    expect(pauseOverlap({ date: "2026-11-23", time: "11:45", minutes: 30, week })).toEqual(lunch);
    expect(pauseOverlap({ date: "2026-11-23", time: "11:30", minutes: 30, week })).toBeNull();
  });
  it("sem serviço escolhido conta só o horário de começo", () => {
    expect(pauseOverlap({ date: "2026-11-23", time: "12:30", minutes: 0, week })).toEqual(lunch);
    expect(pauseOverlap({ date: "2026-11-23", time: "11:30", minutes: 0, week })).toBeNull();
  });
  it("atendimento que atravessa a meia-noite não vira pausa do dia seguinte", () => {
    expect(pauseOverlap({ date: "2026-11-23", time: "23:30", minutes: 60, week })).toBeNull();
  });
  it("usa a pausa do dia da semana certo", () => {
    expect(pauseOverlap({ date: "2026-11-28", time: "12:00", minutes: 60, week })).toBeNull(); // sábado sem pausa
    expect(pauseOverlap({ date: "2026-11-22", time: "12:00", minutes: 60, week })).toBeNull(); // domingo fechado
    expect(pauseOverlap({ date: "2026-11-27", time: "12:00", minutes: 60, week })).toEqual(lunch); // sexta
  });
  it("sem expediente ou com data/hora inválida, não avisa", () => {
    expect(pauseOverlap({ date: "2026-11-23", time: "12:00", minutes: 60, week: null })).toBeNull();
    expect(pauseOverlap({ date: "", time: "12:00", minutes: 60, week })).toBeNull();
    expect(pauseOverlap({ date: "2026-11-23", time: "", minutes: 60, week })).toBeNull();
  });
});

it("texto do aviso mostra a faixa da pausa", () => {
  expect(pauseWarning(lunch)).toBe("Esse horário pega sua pausa (12:00 às 13:00)");
});
