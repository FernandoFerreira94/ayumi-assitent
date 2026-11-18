import { describe, expect, it } from "vitest";
import { byMonth, monthsUpTo, noShows, topClients } from "@/features/finance/insights";

const at = (d: string) => new Date(`${d}T12:00:00-03:00`);

describe("monthsUpTo", () => {
  it("volta o ano", () => {
    expect(monthsUpTo("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("byMonth", () => {
  it("separa recebido, previsto e gasto por mês no fuso do estúdio", () => {
    const appts = [
      { startsAt: at("2026-10-05"), priceCents: 100, status: "done" as const },
      { startsAt: at("2026-11-02"), priceCents: 200, status: "done" as const },
      { startsAt: at("2026-11-20"), priceCents: 50, status: "confirmed" as const },
      { startsAt: at("2026-11-21"), priceCents: 70, status: "no_show" as const },
      // 01/11 00:30 em Brasília é 31/10 em UTC: conta em novembro
      { startsAt: new Date("2026-11-01T03:30:00Z"), priceCents: 10, status: "done" as const },
    ];
    const r = byMonth(["2026-10", "2026-11"], appts, [{ spentOn: "2026-11-10", amountCents: 30 }]);
    expect(r).toEqual([
      { ym: "2026-10", received: 100, forecast: 100, spent: 0 },
      { ym: "2026-11", received: 210, forecast: 260, spent: 30 },
    ]);
  });
});

describe("topClients e noShows", () => {
  const rows = [
    { clientId: "a", clientName: "Ana", startsAt: at("2026-11-01"), priceCents: 100, status: "done" as const },
    { clientId: "a", clientName: "Ana", startsAt: at("2026-11-08"), priceCents: 100, status: "done" as const },
    { clientId: "b", clientName: "Bia", startsAt: at("2026-11-02"), priceCents: 150, status: "done" as const },
    { clientId: "c", clientName: "Cris", startsAt: at("2026-11-03"), priceCents: 999, status: "no_show" as const },
  ];
  it("ordena por valor e ignora quem não concluiu", () => {
    expect(topClients(rows).map((c) => [c.name, c.cents, c.visits])).toEqual([
      ["Ana", 200, 2],
      ["Bia", 150, 1],
    ]);
  });
  it("taxa de faltas sobre o que já aconteceu", () => {
    expect(noShows(rows)).toEqual({ count: 1, pct: 25, lostCents: 999 });
    expect(noShows([]).pct).toBeNull();
  });
});
