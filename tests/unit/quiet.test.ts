import { describe, expect, it } from "vitest";
import { nextSendable } from "@/features/reminders/quiet";

describe("próximo horário que pode sair", () => {
  it("fora do silêncio, sai na hora", () => {
    const t = new Date("2026-11-24T13:00:00Z"); // 10h BRT
    expect(nextSendable(t)).toEqual(t);
  });
  it("de 21h às 0h vai para as 6h do dia seguinte", () => {
    expect(nextSendable(new Date("2026-11-25T01:30:00Z"))).toEqual(new Date("2026-11-25T09:00:00Z")); // 22h30 BRT
  });
  it("de 0h às 6h vai para as 6h do mesmo dia", () => {
    expect(nextSendable(new Date("2026-11-25T05:00:00Z"))).toEqual(new Date("2026-11-25T09:00:00Z")); // 2h BRT
  });
});
