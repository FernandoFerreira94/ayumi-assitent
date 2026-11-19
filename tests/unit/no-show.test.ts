import { describe, expect, it } from "vitest";
import { canMarkNoShow, noShowHint } from "@/features/appointments/no-show";
import { toInstant } from "@/lib/dates";

describe("Faltou só depois do horário", () => {
  const start = toInstant("2026-11-18", "21:00"); // 21:00 em São Paulo = 00:00 UTC do dia 19

  it("antes do início não deixa", () => {
    expect(canMarkNoShow(start, new Date("2026-11-18T23:59:59Z"))).toBe(false);
    expect(canMarkNoShow(start, new Date("2026-11-18T12:00:00Z"))).toBe(false);
  });

  it("no horário de início ou depois deixa", () => {
    expect(canMarkNoShow(start, new Date("2026-11-19T00:00:00Z"))).toBe(true);
    expect(canMarkNoShow(start, new Date("2026-11-20T10:00:00Z"))).toBe(true);
  });

  it("dica mostra o horário", () => {
    expect(noShowHint("21:00")).toBe("Disponível a partir das 21:00");
  });
});
