import { describe, expect, it } from "vitest";
import { dayVersion } from "@/features/appointments/version";

const at = (h: number) => new Date(Date.UTC(2026, 10, 8, h));
const row = {
  id: "a1",
  startsAt: at(12),
  endsAt: at(13),
  priceCents: 15000,
  status: "confirmed",
  clientName: "Maria",
  serviceName: "Alongamento",
};
const block = { id: "b1", startsAt: at(15), endsAt: at(16), reason: "Almoço" };

describe("versão da agenda do dia", () => {
  it("é a mesma para os mesmos dados, em qualquer ordem", () => {
    const other = { ...row, id: "a2", startsAt: at(14), endsAt: at(15) };
    expect(dayVersion([row, other], [block])).toBe(dayVersion([other, row], [block]));
  });
  it("muda com atendimento novo, status novo, horário novo ou bloqueio removido", () => {
    const base = dayVersion([row], [block]);
    expect(dayVersion([row, { ...row, id: "a2" }], [block])).not.toBe(base);
    expect(dayVersion([{ ...row, status: "done" }], [block])).not.toBe(base);
    expect(dayVersion([{ ...row, startsAt: at(13), endsAt: at(14) }], [block])).not.toBe(base);
    expect(dayVersion([row], [])).not.toBe(base);
  });
});
