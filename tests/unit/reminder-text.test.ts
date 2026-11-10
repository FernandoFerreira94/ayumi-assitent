import { describe, expect, it } from "vitest";
import { reminderText } from "@/features/reminders/core";

const start = new Date("2026-11-11T17:30:00Z"); // 14:30 em São Paulo
const eve = new Date("2026-11-10T15:00:00Z");
describe("texto do lembrete", () => {
  it("diz amanhã, usa o primeiro nome e dá as opções 1, 2 e 3", () => {
    const t = reminderText({ client: "Maria Silva", service: "Gel", startsAt: start }, eve);
    expect(t.split("\n")[0]).toBe("Oi, Maria! Passando para lembrar do seu horário de Gel amanhã às 14:30. Te espero com carinho! 💜");
    expect(t).toContain("1 - Confirmo\n2 - Cancelar\n3 - Reagendar");
  });
  it("diz hoje quando é no mesmo dia", () => {
    expect(reminderText({ client: "Bia", service: "Gel", startsAt: start }, new Date("2026-11-11T12:00:00Z"))).toContain("hoje às 14:30");
  });
  it("usa o texto da dona com as chaves preenchidas, e as opções vêm sempre no fim", () => {
    const t = reminderText({ client: "Bia Souza", service: "Gel", startsAt: start }, eve, {
      template: "{salao}: {nome}, seu {servico} é {dia} às {hora}. {desconhecida}",
      name: "Studio Yumi",
    });
    expect(t.split("\n")[0]).toBe("Studio Yumi: Bia, seu Gel é amanhã às 14:30. {desconhecida}");
    expect(t.endsWith("3 - Reagendar")).toBe(true);
  });
  it("texto em branco volta ao padrão", () => {
    expect(reminderText({ client: "Bia", service: "Gel", startsAt: start }, eve, { template: "   " })).toContain("Passando para lembrar");
  });
});

describe("2º aviso e escolhas da dona", () => {
  it("2º aviso usa o texto padrão com o horário e termina com as opções", async () => {
    const { secondReminderText } = await import("@/features/reminders/text");
    const t = secondReminderText({ client: "Bia Souza", service: "Gel", startsAt: start }, eve);
    expect(t.split("\n")[0]).toBe("Oi, Bia! Passando para lembrar do seu horário de Gel amanhã às 14:30 😊 Pode me confirmar?");
    expect(t.endsWith("3 - Reagendar")).toBe(true);
  });
  it("2º aviso aceita o texto da dona", async () => {
    const { secondReminderText } = await import("@/features/reminders/text");
    const t = secondReminderText({ client: "Bia", service: "Gel", startsAt: start }, eve, { template: "{nome}, confirma {hora}?" });
    expect(t.split("\n")[0]).toBe("Bia, confirma 14:30?");
  });
  it("{valor} sai vazio quando não há valor e com R$ quando há", () => {
    const tpl = { template: "Valor: {valor}" };
    expect(reminderText({ client: "Bia", service: "Gel", startsAt: start }, eve, tpl).split("\n")[0]).toBe("Valor:");
    expect(reminderText({ client: "Bia", service: "Gel", startsAt: start, priceCents: 9000 }, eve, tpl)).toMatch(/Valor: R\$\s90,00/);
  });
  it("nome do contato inteiro quando a dona escolhe", () => {
    const t = reminderText({ client: "Maria Zona Norte", service: "Gel", startsAt: start }, eve, { fullName: true });
    expect(t).toMatch(/^Oi, Maria Zona Norte!/);
  });
});
