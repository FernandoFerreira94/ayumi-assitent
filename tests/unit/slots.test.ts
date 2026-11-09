import { describe, expect, it } from "vitest";
import { DEFAULT_HOURS, freeSlots, weekdayOf } from "@/features/hours/slots";
import { toInstant } from "@/lib/dates";

const day = { opens: "09:00", closes: "12:00" };
const at = (t: string) => toInstant("2026-11-10", t);

describe("horários livres", () => {
  it("lista a grade inteira quando não há nada ocupado", () => {
    expect(freeSlots({ date: "2026-11-10", day, durationMin: 60, busy: [] })).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
    ]);
  });
  it("exige que o atendimento caiba até o fechamento", () => {
    expect(freeSlots({ date: "2026-11-10", day, durationMin: 120, busy: [] })).toEqual(["09:00", "09:30", "10:00"]);
  });
  it("tira horários que cruzam um atendimento, mas permite encostar", () => {
    const busy = [{ startsAt: at("10:00"), endsAt: at("11:00") }];
    expect(freeSlots({ date: "2026-11-10", day, durationMin: 60, busy })).toEqual(["09:00", "11:00"]);
  });
  it("a pausa do dia funciona como horário ocupado", () => {
    const comPausa = { ...day, breakStart: "10:00", breakEnd: "10:30" };
    expect(freeSlots({ date: "2026-11-10", day: comPausa, durationMin: 30, busy: [] })).toEqual([
      "09:00",
      "09:30",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });
  it("estúdio fechado não tem vagas", () => {
    expect(freeSlots({ date: "2026-11-10", day: null, durationMin: 60, busy: [] })).toEqual([]);
  });
  it("esconde o que já passou", () => {
    expect(freeSlots({ date: "2026-11-10", day, durationMin: 60, busy: [], notBefore: at("10:15") })).toEqual([
      "10:30",
      "11:00",
    ]);
  });
  it("dia da semana de uma data", () => {
    expect(weekdayOf("2026-11-10")).toBe(2); // terça
    expect(DEFAULT_HOURS[0]).toBeNull();
  });
});
