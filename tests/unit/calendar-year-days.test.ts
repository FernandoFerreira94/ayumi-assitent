import { describe, expect, it } from "vitest";
import { buildYearDays, MAX_PILLS } from "@/features/calendar/data";

// 18:00 em São Paulo (UTC-3) = 21:00Z
const at = (day: string, hm: string) => new Date(`${day}T${hm}:00-03:00`);
const appt = (day: string, hm: string, name = "Fernanda Lima") => ({
  startsAt: at(day, hm),
  clientName: name,
  serviceColor: "lav",
  status: "confirmed",
});
const ext = (day: string, hm: string, reason: string | null = "Curso", source = "icloud") => ({
  startsAt: at(day, hm),
  reason,
  source,
});

describe("resumo do ano no Calendário", () => {
  it("evento de fora entra cinza com a origem, sem contar como atendimento", () => {
    const d = buildYearDays([appt("2026-11-16", "09:00")], [ext("2026-11-16", "18:00")]);
    expect(d["2026-11-16"]).toEqual({
      n: 1,
      x: 1,
      pills: [
        { name: "Fernanda", color: "lav", st: "ok" },
        { name: "Curso", ext: "icloud" },
      ],
    });
  });

  it("curso diário às 18:00 aparece em todos os dias, no dia do fuso do estúdio (não no dia UTC)", () => {
    const events = ["2026-11-16", "2026-11-17", "2026-11-18"].map((d) => ext(d, "22:30", "Curso", "google"));
    const d = buildYearDays([], events);
    expect(Object.keys(d)).toEqual(["2026-11-16", "2026-11-17", "2026-11-18"]);
    expect(d["2026-11-17"]).toEqual({ n: 0, x: 1, pills: [{ name: "Curso", ext: "google" }] });
  });

  it("pílulas na ordem do horário, misturando atendimento e evento de fora, até o limite", () => {
    const d = buildYearDays(
      [appt("2026-11-20", "14:00", "Ana"), appt("2026-11-20", "08:00", "Bia")],
      [ext("2026-11-20", "07:00", "Academia"), ext("2026-11-20", "18:00")],
    );
    expect(d["2026-11-20"].pills.map((p) => p.name)).toEqual(["Academia", "Bia", "Ana"]);
    expect(d["2026-11-20"].pills).toHaveLength(MAX_PILLS);
    expect(d["2026-11-20"].n + (d["2026-11-20"].x ?? 0)).toBe(4);
  });

  it("sem título vira o nome da origem; título longo é cortado; bloqueio do app fica fora", () => {
    const d = buildYearDays(
      [],
      [ext("2026-11-21", "10:00", "  ", "google"), ext("2026-11-21", "11:00", "x".repeat(80)), ext("2026-11-21", "12:00", "Almoço", "app")],
    );
    expect(d["2026-11-21"].pills).toEqual([
      { name: "Evento do Google", ext: "google" },
      { name: "x".repeat(24), ext: "icloud" },
    ]);
    expect(d["2026-11-21"].x).toBe(2);
  });

  it("só atendimentos: formato antigo (sem x)", () => {
    expect(buildYearDays([appt("2026-11-22", "10:00")], [])["2026-11-22"]).toEqual({
      n: 1,
      pills: [{ name: "Fernanda", color: "lav", st: "ok" }],
    });
  });
});
