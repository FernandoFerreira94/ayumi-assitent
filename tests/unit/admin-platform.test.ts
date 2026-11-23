import { describe, expect, it } from "vitest";
import { daysSince, idleSalons, pctChange, recentSalons } from "@/features/admin/platform-rules";
import type { UsageRow } from "@/features/admin/usage-rules";

const NOW = new Date("2026-11-23T15:00:00Z");
const DAY = 86_400_000;
const ago = (d: number) => new Date(NOW.getTime() - d * DAY);

function row(id: string, created: number, seen: number | null): UsageRow {
  return {
    tenantId: id,
    salonName: id,
    ownerName: null,
    createdAt: ago(created),
    lastSeenAt: seen === null ? null : ago(seen),
    whatsapp: false,
    clients: 0,
    appts30: 0,
    msgsOut30: 0,
    msgsIn30: 0,
  };
}

describe("pctChange", () => {
  it("calcula a variação e devolve null sem base", () => {
    expect(pctChange(15, 10)).toBeCloseTo(0.5);
    expect(pctChange(5, 10)).toBeCloseTo(-0.5);
    expect(pctChange(3, 0)).toBeNull();
  });
});

describe("recentSalons", () => {
  it("pega só os cadastrados na janela, do mais novo ao mais antigo", () => {
    const rows = [row("a", 40, 1), row("b", 2, 1), row("c", 10, null)];
    expect(recentSalons(rows, NOW, 30).map((r) => r.tenantId)).toEqual(["b", "c"]);
  });
});

describe("idleSalons", () => {
  it("lista quem não usa há mais de N dias, nunca usou primeiro, e ignora cadastro recente", () => {
    const rows = [row("ativo", 60, 1), row("parado", 60, 20), row("nunca", 30, null), row("novo", 3, null), row("mais-parado", 90, 50)];
    expect(idleSalons(rows, NOW, 7).map((r) => r.tenantId)).toEqual(["nunca", "mais-parado", "parado"]);
  });
});

describe("daysSince", () => {
  it("conta dias inteiros e nunca fica negativo", () => {
    expect(daysSince(ago(3.5), NOW)).toBe(3);
    expect(daysSince(new Date(NOW.getTime() + DAY), NOW)).toBe(0);
  });
});
