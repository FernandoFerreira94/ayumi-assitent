import { describe, expect, it } from "vitest";
import { reminderText } from "@/features/reminders/core";
import { bookingText, professionalLabel, secondReminderText } from "@/features/reminders/text";

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
  it("2º aviso para quem já confirmou: só lembra, sem as opções 1/2/3", async () => {
    const { secondReminderText, DEFAULT_SECOND } = await import("@/features/reminders/text");
    const a = { client: "Bia Souza", service: "Gel", startsAt: start };
    const t = secondReminderText(a, eve, {}, true);
    expect(t).toBe("Oi, Bia! Passando para lembrar do seu horário de Gel amanhã às 14:30 😊 Te espero com carinho! 💜");
    expect(t).not.toContain("Responda com o número");
    // Texto padrão antigo salvo no banco também vira o lembrete sem pergunta
    expect(secondReminderText(a, eve, { template: DEFAULT_SECOND }, true)).not.toContain("Pode me confirmar");
    // Texto da dona é respeitado, só sem as opções
    expect(secondReminderText(a, eve, { template: "Até {hora}, {nome}!" }, true)).toBe("Até 14:30, Bia!");
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

describe("chave {profissional}", () => {
  const base = { client: "Bia Souza", service: "Gel", startsAt: start };
  const first = (t: string) => t.split("\n")[0];

  it("vira o nome da profissional do atendimento", () => {
    const t = reminderText({ ...base, professional: "Ana" }, eve, { template: "Oi, {nome}! {servico} com {profissional} {dia}." });
    expect(first(t)).toBe("Oi, Bia! Gel com Ana amanhã.");
  });
  it("sem profissional (salão com uma só) some sem deixar espaço duplo", () => {
    const t = reminderText({ ...base, professional: "" }, eve, { template: "Oi, {nome}! {servico} com {profissional} {dia}." });
    expect(first(t)).toBe("Oi, Bia! Gel com amanhã.");
    expect(first(t)).not.toMatch(/ {2}/);
  });
  it("sem profissional não sobra pontuação solta antes da chave", () => {
    const t = reminderText({ ...base }, eve, { template: "{servico}, {profissional}! Até {dia}." });
    expect(first(t)).toBe("Gel! Até amanhã.");
  });
  it("sem profissional, a linha que só existia para ela some", () => {
    const t = bookingText({ ...base }, eve, { template: "Oi, {nome}!\nProfissional: {profissional}\n🕒 {hora}" });
    expect(t).toBe("Oi, Bia!\n🕒 14:30");
  });
  it("sem profissional, chave no começo da linha não deixa vírgula", () => {
    const t = reminderText({ ...base }, eve, { template: "{profissional}, te espero {dia}." });
    expect(first(t)).toBe("te espero amanhã.");
  });
  it("a chave vale também na mensagem de agendamento e no 2º aviso", () => {
    expect(bookingText({ ...base, professional: "Ana" }, eve, { template: "Com {profissional}" })).toBe("Com Ana");
    expect(
      secondReminderText({ ...base, professional: "Ana" }, eve, { template: "{profissional} te espera" }).split("\n")[0],
    ).toBe("Ana te espera");
  });
  it("professionalLabel: só mostra o nome quando o salão tem 2 ou mais profissionais", () => {
    expect(professionalLabel("Ana", 1)).toBe("");
    expect(professionalLabel("Ana", 2)).toBe("Ana");
    expect(professionalLabel(null, 3)).toBe("");
    expect(professionalLabel("  Ana  ", 3)).toBe("Ana");
  });
});
