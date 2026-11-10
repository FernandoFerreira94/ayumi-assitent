import { describe, expect, it } from "vitest";
import { bookingText } from "@/features/messaging/booking";

const a = { client: "Maria Silva", service: "Gel", startsAt: new Date("2026-11-11T17:30:00Z"), priceCents: 12050 }; // 14:30 BRT, quarta
const eve = new Date("2026-11-10T15:00:00Z");

describe("mensagem de agendamento confirmado", () => {
  it("diz que deu certo, o dia e o horário, sem valor no texto padrão", () => {
    expect(bookingText(a, eve)).toBe(
      "Oi, Maria! Seu agendamento de Gel está confirmado 💜\n📅 amanhã, dia 11/11\n🕒 14:30\n\nTe esperamos com carinho!",
    );
    expect(bookingText(a, eve)).not.toMatch(/R\$/);
  });
  it("o valor entra só quando a dona põe {valor} no texto", () => {
    const t = bookingText(a, eve, { template: "Oi, {nome}! {servico} {dia} às {hora}\n💰 {valor}" });
    expect(t).toMatch(/^Oi, Maria! Gel amanhã, dia 11\/11 às 14:30\n💰 R\$\s120,50$/);
  });
  it("usa o dia da semana quando é mais longe", () => {
    expect(bookingText(a, new Date("2026-11-05T15:00:00Z"))).toContain("quarta-feira, dia 11/11");
  });
  it("chama pelo nome do contato quando a dona escolhe", () => {
    expect(bookingText({ ...a, client: "Maria  Zona Norte" }, eve, { fullName: true })).toMatch(
      /^Oi, Maria Zona Norte!/,
    );
  });
});
