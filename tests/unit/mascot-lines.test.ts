import { describe, expect, it } from "vitest";
import { agendaLines, HIGHLIGHT, moneyLines, rotation } from "@/features/appointments/mascot-lines";

describe("rotation", () => {
  it("põe o resumo primeiro e alterna um assunto por vez", () => {
    expect(rotation("resumo", [["c1", "c2"], ["m1"], ["a1", "a2", "a3"]])).toEqual([
      "resumo", "c1", "m1", "a1", "c2", "a2", "a3",
    ]);
  });

  it("sem resumo e sem grupos fica vazio", () => {
    expect(rotation(undefined, [[], []])).toEqual([]);
  });
});

describe("moneyLines", () => {
  const today = { isToday: true, receivedCents: 5000, forecastCents: 12000, monthReceivedCents: 80000 };

  it("hoje fala recebido, o que falta e o mês", () => {
    const lines = moneyLines(today, false);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("50,00");
    expect(lines[1]).toContain("70,00");
    expect(lines[2]).toContain("800,00");
  });

  it("com o olhinho fechado não mostra valores", () => {
    const lines = moneyLines(today, true);
    expect(lines.join(" ")).not.toMatch(/\d/);
    expect(lines[0]).toContain("R$ •••••");
  });

  it("outro dia só fala o recebido sobre o previsto", () => {
    expect(moneyLines({ ...today, isToday: false }, false)).toHaveLength(1);
    expect(moneyLines({ isToday: false, receivedCents: 0, forecastCents: 0 }, false)).toEqual([]);
  });
});

describe("agendaLines", () => {
  it("vagas livres e amanhã", () => {
    expect(agendaLines({ monthReceivedCents: 0, freeToday: ["14:00", "15:00"], tomorrowCount: 1 })).toEqual([
      "Ainda tem 2 horários livres hoje. O primeiro é às 14:00.",
      "Amanhã você tem 1 atendimento.",
    ]);
  });

  it("dia fechado não fala de vagas; sem livres comemora", () => {
    expect(agendaLines({ monthReceivedCents: 0, freeToday: null, tomorrowCount: 0 })).toEqual([
      "Amanhã ainda está livre por enquanto.",
    ]);
    expect(agendaLines({ monthReceivedCents: 0, freeToday: [], tomorrowCount: 3 })[0]).toContain("Arrasou");
  });
});

describe("HIGHLIGHT", () => {
  it("separa horas e valores para destaque", () => {
    const parts = "Sobrou 1 horário livre hoje, às 14:30.".split(HIGHLIGHT);
    expect(parts.filter((_, n) => n % 2)).toEqual(["1", "14:30"]);
  });
});
