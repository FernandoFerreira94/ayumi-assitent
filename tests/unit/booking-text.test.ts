import { describe, expect, it } from "vitest";
import { bookingText } from "@/features/messaging/booking";

const a = { client: "Maria Silva", service: "Gel", startsAt: new Date("2026-11-11T17:30:00Z"), priceCents: 12050 }; // 14:30 BRT, quarta
const eve = new Date("2026-11-10T15:00:00Z");

describe("mensagem de agendamento confirmado", () => {
  it("diz que deu certo, o dia e o horário, sem valor no texto padrão", () => {
    expect(bookingText(a, eve)).toBe(
      "Oi! Seu agendamento de Gel está confirmado 💜\n📅 amanhã, dia 11/11\n🕒 14:30\n\nTe esperamos com carinho!",
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
  it("texto padrão sem o nome; com {nome} chama pelo nome do contato quando a dona escolhe", () => {
    expect(bookingText(a, eve)).not.toContain("Maria");
    expect(
      bookingText({ ...a, client: "Maria  Zona Norte" }, eve, { fullName: true, template: "Oi, {nome}!" }),
    ).toMatch(/^Oi, Maria Zona Norte!/);
  });
  it("{endereco} e {mapa} trazem o endereço do estúdio e o link do mapa", () => {
    const address = "Rua A, 430 - Centro, São José dos Campos - SP, 12245-000";
    const t = bookingText(a, eve, { address, template: "Te espero!\n📍 {endereco}\n🗺️ {mapa}" });
    expect(t).toContain(`📍 ${address}`);
    expect(t).toContain("🗺️ https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%20430");
  });
  it("texto padrão já traz o endereço e o mapa quando o estúdio tem endereço", () => {
    const address = "Rua A, 430 - Centro, São José dos Campos - SP, 12245-000";
    expect(bookingText(a, eve, { address })).toBe(
      `Oi! Seu agendamento de Gel está confirmado 💜\n📅 amanhã, dia 11/11\n🕒 14:30\n📍 ${address}\n🗺️ https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}\n\nTe esperamos com carinho!`,
    );
  });
  it("sem endereço cadastrado, a linha do {endereco}/{mapa} some inteira", () => {
    const t = bookingText(a, eve, { template: "Te espero!\n📍 {endereco}\n🗺️ {mapa}\nBeijos" });
    expect(t).toBe("Te espero!\nBeijos");
    expect(bookingText(a, eve, { template: "Fica em {endereco}, perto do mercado" })).toBe(
      "Fica em , perto do mercado",
    );
  });
});
