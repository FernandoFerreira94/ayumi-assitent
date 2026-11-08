import { describe, expect, it } from "vitest";
import { periodRange } from "@/features/finance/period";
import { summarize } from "@/features/finance/summary";

const iso = ([a, b]: [Date, Date]) => [a.toISOString(), b.toISOString()];

describe("períodos do financeiro no fuso de SP", () => {
  it("semana vai de segunda a domingo (domingo 08/11/2026 fica na semana do dia 2)", () => {
    const w = periodRange("semana", "2026-11-08");
    expect(iso(w.range)).toEqual(["2026-11-02T03:00:00.000Z", "2026-11-09T03:00:00.000Z"]);
    expect(w.label).toBe("2 de nov a 8 de nov");
  });
  it("mês atravessa a virada do ano", () => {
    expect(iso(periodRange("mes", "2026-12-15").range)).toEqual(["2026-12-01T03:00:00.000Z", "2027-01-01T03:00:00.000Z"]);
  });
  it("semestre é janeiro–junho ou julho–dezembro", () => {
    expect(iso(periodRange("semestre", "2026-03-10").range)).toEqual(["2026-01-01T03:00:00.000Z", "2026-07-01T03:00:00.000Z"]);
    const s2 = periodRange("semestre", "2026-11-08");
    expect(iso(s2.range)).toEqual(["2026-07-01T03:00:00.000Z", "2027-01-01T03:00:00.000Z"]);
    expect(s2.label).toBe("2º semestre de 2026");
  });
});

describe("resumo do ganho", () => {
  const row = (serviceName: string, priceCents: number, status: "done" | "confirmed" | "no_show" = "done") => ({
    serviceName,
    priceCents,
    status,
  });

  it("recebido só dos concluídos; previsto ignora faltas; ticket médio dos concluídos", () => {
    const s = summarize([row("Gel", 10000), row("Gel", 10000), row("Pé", 5000, "confirmed"), row("Mão", 4000, "no_show")]);
    expect(s).toMatchObject({ received: 20000, forecast: 25000, doneCount: 2, averageCents: 10000 });
    expect(s.slices).toEqual([{ name: "Gel", cents: 20000 }]);
  });
  it("mais de 6 serviços: os 5 maiores e o resto em Outros", () => {
    const s = summarize(["A", "B", "C", "D", "E", "F", "G"].map((n, i) => row(n, (10 - i) * 100)));
    expect(s.slices.map((x) => x.name)).toEqual(["A", "B", "C", "D", "E", "Outros"]);
    expect(s.slices.at(-1)!.cents).toBe(500 + 400);
  });
});
