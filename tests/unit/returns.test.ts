import { describe, expect, it } from "vitest";
import { daysBetween, pickReturnDays, spread, returnDaysOf, returnDue, returnWindow } from "@/features/returns/rules";
import { serviceInput } from "@/features/services/schema";

describe("retorno da cliente", () => {
  it("sem serviço com retorno não prevê nada", () => {
    expect(returnDaysOf([])).toBeNull();
    expect(returnDue("2026-11-16", [{ returnDays: null }])).toBeNull();
  });

  it("usa o menor retorno entre os serviços", () => {
    expect(returnDaysOf([{ returnDays: 30 }, { returnDays: null }, { returnDays: 15 }])).toBe(15);
  });

  it("conta os dias a partir do atendimento, virando mês e ano", () => {
    expect(returnDue("2026-11-16", [{ returnDays: 15 }])).toBe("2026-12-01");
    expect(returnDue("2026-12-20", [{ returnDays: 21 }])).toBe("2027-01-10");
  });
});

describe("campo Retorno sugerido do serviço", () => {
  const base = { name: "Unha", durationMin: "60", price: "50", bufferMin: "0", color: "lav" };
  const parse = (returnDays: unknown) => serviceInput.safeParse({ ...base, returnDays });

  it("vazio vira sem retorno", () => {
    expect(parse("")).toMatchObject({ success: true, data: { returnDays: null } });
    expect(parse(null)).toMatchObject({ success: true, data: { returnDays: null } });
  });

  it("aceita de 1 a 365 dias", () => {
    expect(parse("15")).toMatchObject({ success: true, data: { returnDays: 15 } });
    expect(parse("365").success).toBe(true);
  });

  it("recusa zero, negativo, quebrado e acima de um ano", () => {
    for (const v of ["0", "-3", "7.5", "366", "abc"]) expect(parse(v).success).toBe(false);
  });
});

describe("dias sugeridos para o retorno", () => {
  it("conta dias corridos", () => {
    expect(daysBetween("2026-11-28", "2026-12-01")).toBe(3);
    expect(daysBetween("2026-12-01", "2026-11-28")).toBe(-3);
  });

  it("vai de 2 antes a 5 depois da data prevista, começando pela mais perto", () => {
    const w = returnWindow("2026-12-01", "2026-11-16");
    expect(w[0]).toBe("2026-12-01");
    expect(w.slice(1, 3)).toEqual(["2026-11-30", "2026-12-02"]);
    expect([...w].sort()).toEqual([
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
      "2026-12-04",
      "2026-12-05",
      "2026-12-06",
    ]);
  });

  it("retorno atrasado ou muito perto começa amanhã, nunca hoje", () => {
    const w = returnWindow("2026-11-10", "2026-11-16");
    expect(w[0]).toBe("2026-11-17");
    expect(w).not.toContain("2026-11-16");
    expect([...w].sort()[0]).toBe("2026-11-17");
  });

  it("pega até 4 dias com vaga, mais perto da data, em ordem de data e com 3 horários", () => {
    const window = returnWindow("2026-12-01", "2026-11-16");
    const full = ["09:00", "10:00", "11:00", "14:00"];
    // 01/12 lotado; domingo 29/11 fechado
    const slotsOf = (d: string) => (d === "2026-12-01" || d === "2026-11-29" ? [] : full);
    const days = pickReturnDays(window, slotsOf);
    expect(days.map((d) => d.date)).toEqual(["2026-11-30", "2026-12-02", "2026-12-03", "2026-12-04"]);
    expect(days[0].slots).toEqual(["09:00", "11:00", "14:00"]);
  });

  it("espalha os horários pelo dia: primeiro, meio e último", () => {
    const day = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "16:30"];
    expect(spread(day, 3)).toEqual(["09:00", "10:30", "16:30"]);
    expect(spread(["09:00", "10:00"], 3)).toEqual(["09:00", "10:00"]);
  });

  it("sem vaga nenhuma volta vazio", () => {
    expect(pickReturnDays(returnWindow("2026-12-01", "2026-11-16"), () => [])).toEqual([]);
  });
});
