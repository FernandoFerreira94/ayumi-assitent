import { describe, expect, it } from "vitest";
import { reminderText } from "@/features/reminders/core";

const start = new Date("2026-11-11T17:30:00Z"); // 14:30 em São Paulo
describe("texto do lembrete", () => {
  it("diz amanhã e usa o primeiro nome", () => {
    const t = reminderText(
      { client: "Maria Silva", service: "Gel", startsAt: start },
      new Date("2026-11-10T15:00:00Z"),
    );
    expect(t).toBe("Oi, Maria! Passando para lembrar do seu horário de Gel amanhã às 14:30. Te espero! 💜");
  });
  it("diz hoje quando é no mesmo dia", () => {
    expect(
      reminderText({ client: "Bia", service: "Gel", startsAt: start }, new Date("2026-11-11T12:00:00Z")),
    ).toContain("hoje às 14:30");
  });
});
