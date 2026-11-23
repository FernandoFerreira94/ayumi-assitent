import { describe, expect, it } from "vitest";
import { pendingMarker, pendingText } from "@/features/messaging/pending-rules";

const now = new Date("2026-11-11T09:00:00Z");
const appt = {
  status: "confirmed",
  startsAt: new Date("2026-11-11T13:00:00Z"),
  clientName: "Bia Souza",
  fullName: false,
};

describe("resposta guardada à noite", () => {
  it("monta o texto na hora de sair", () => {
    expect(pendingText(pendingMarker("confirm"), appt, now)).toContain("de hoje às 10:00 está confirmado");
  });
  it("não sai se o estado mudou, o horário passou ou o marcador é estranho", () => {
    expect(pendingText("@confirm", { ...appt, status: "cancelled" }, now)).toBeNull();
    expect(pendingText("@cancel", appt, now)).toBeNull();
    expect(pendingText("@confirm", appt, new Date("2026-11-11T14:00:00Z"))).toBeNull();
    expect(pendingText("@xyz", appt, now)).toBeNull();
  });
  it("texto antigo (de antes do marcador) sai como está", () => {
    expect(pendingText("Oba, confirmado", appt, now)).toBe("Oba, confirmado");
  });
});
