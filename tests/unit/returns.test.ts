import { describe, expect, it } from "vitest";
import { returnDaysOf, returnDue } from "@/features/returns/rules";
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
