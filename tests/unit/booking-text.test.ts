import { describe, expect, it } from "vitest";
import { bookingText } from "@/features/messaging/booking";

const a = { client: "Maria Silva", service: "Gel", startsAt: new Date("2026-11-11T17:30:00Z"), priceCents: 12050 }; // 14:30 BRT, quarta
const eve = new Date("2026-11-10T15:00:00Z");

describe("mensagem de agendamento confirmado", () => {
  it("diz que deu certo, o dia e o horário, sem valor por padrão", () => {
    expect(bookingText(a, eve, { includePrice: false })).toBe(
      "Oi, Maria! Seu agendamento de Gel está confirmado 💜\n📅 amanhã, dia 11/11\n🕒 14:30\n\nTe esperamos com carinho!",
    );
  });
  it("inclui o valor só quando a profissional liga", () => {
    const t = bookingText(a, eve, { includePrice: true });
    expect(t).toContain("💰");
    expect(t).toMatch(/120,50/);
    expect(bookingText(a, eve, { includePrice: false })).not.toMatch(/R\$/);
  });
  it("usa o dia da semana quando é mais longe", () => {
    expect(bookingText(a, new Date("2026-11-05T15:00:00Z"), { includePrice: false })).toContain(
      "quarta-feira, dia 11/11",
    );
  });
});
