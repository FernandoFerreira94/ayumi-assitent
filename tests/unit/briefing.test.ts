import { describe, expect, it } from "vitest";
import { dayBriefing } from "@/features/appointments/briefing";
import { receivedCents } from "@/features/appointments/core";

const at = (hhmm: string) => new Date(`2026-11-08T${hhmm}:00-03:00`);
const now = at("12:00");

describe("balão do dia da Bolha", () => {
  it("dia sem atendimento sugere divulgar vaga", () => {
    expect(dayBriefing([], now, true).lines[0]).toBe("Dia livre! Que tal divulgar uma vaga?");
  });
  it("aponta a próxima cliente pelo primeiro nome", () => {
    const rows = [
      { startsAt: at("09:00"), clientName: "Bia", status: "done" as const },
      { startsAt: at("14:00"), clientName: "Ana Souza", status: "confirmed" as const },
    ];
    expect(dayBriefing(rows, now, true).lines[0]).toBe("Você tem 2 atendimentos hoje. A próxima é Ana às 14:00.");
  });
  it("tudo concluído comemora", () => {
    const b = dayBriefing([{ startsAt: at("09:00"), clientName: "Bia", status: "done" }], now, true);
    expect(b).toMatchObject({ mood: "happy", lines: ["Dia encerrado! Você concluiu 1 atendimento.", ...b.lines.slice(1)] });
  });
  it("horários passados sem fechar lembram de fechar", () => {
    const b = dayBriefing([{ startsAt: at("09:00"), clientName: "Bia", status: "confirmed" }], now, true);
    expect(b.lines[0]).toBe("Os horários de hoje já passaram. Falta fechar 1 atendimento.");
  });
  it("só fala do dia: sem dicas de uso quando não há mais o que dizer", () => {
    expect(dayBriefing([], now, true).lines).toEqual(["Dia livre! Que tal divulgar uma vaga?"]);
  });
  it("avisa quem ainda não confirmou e o último horário do dia", () => {
    const rows = [
      { startsAt: at("14:00"), clientName: "Ana", status: "confirmed" as const },
      { startsAt: at("16:00"), clientName: "Bia", status: "pending_confirmation" as const },
      { startsAt: at("17:30"), clientName: "Cris", status: "pending_confirmation" as const },
    ];
    expect(dayBriefing(rows, now, true).lines.slice(1)).toEqual([
      "2 clientes ainda não confirmaram o horário.",
      "Seu último atendimento hoje é às 17:30.",
    ]);
  });
  it("falta não conta no resumo", () => {
    const b = dayBriefing([{ startsAt: at("09:00"), clientName: "Bia", status: "no_show" }], now, false);
    expect(b.lines[0]).toBe("Nenhum atendimento nesse dia ainda.");
  });
});

describe("recebido do dia", () => {
  it("soma só os concluídos", () => {
    expect(
      receivedCents([
        { priceCents: 12000, status: "done" },
        { priceCents: 8000, status: "confirmed" },
        { priceCents: 5000, status: "no_show" },
      ]),
    ).toBe(12000);
  });
});
