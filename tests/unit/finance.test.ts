import { describe, expect, it } from "vitest";
import { expenseInput, expenseSlices } from "@/features/finance/expenses";
import { isMonth, monthRange, shiftMonth } from "@/features/finance/period";
import { summarize } from "@/features/finance/summary";

const iso = ([a, b]: [Date, Date]) => [a.toISOString(), b.toISOString()];

describe("mês do financeiro no fuso de SP", () => {
  it("vai do dia 1 ao dia 1 do mês seguinte, atravessando a virada do ano", () => {
    const m = monthRange("2026-12");
    expect(iso(m.range)).toEqual(["2026-12-01T03:00:00.000Z", "2027-01-01T03:00:00.000Z"]);
    expect(m.dates).toEqual(["2026-12-01", "2027-01-01"]);
    expect(m.label).toBe("Dezembro de 2026");
  });
  it("navega entre meses", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
  });
  it("só aceita YYYY-MM", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("mes")).toBe(false);
    expect(isMonth(undefined)).toBe(false);
  });
});

describe("gastos", () => {
  it("valor em reais vira centavos e precisa ser maior que zero", () => {
    const ok = expenseInput.safeParse({ spentOn: "2026-11-08", amount: "1.234,50", category: "aluguel" });
    expect(ok.success && ok.data.amount).toBe(123450);
    expect(expenseInput.safeParse({ spentOn: "2026-11-08", amount: "0,00", category: "aluguel" }).success).toBe(false);
    expect(expenseInput.safeParse({ spentOn: "2026-11-08", amount: "10", category: "luxo" }).success).toBe(false);
  });
  it("pizza por categoria soma e ordena", () => {
    const s = expenseSlices([
      { category: "produtos", amountCents: 1000 },
      { category: "aluguel", amountCents: 5000 },
      { category: "produtos", amountCents: 2000 },
    ]);
    expect(s).toEqual([
      { name: "Aluguel", cents: 5000 },
      { name: "Produtos", cents: 3000 },
    ]);
  });
});

describe("resumo do ganho", () => {
  const row = (serviceName: string, priceCents: number, status: "done" | "confirmed" | "no_show" = "done") => ({
    serviceName,
    priceCents,
    status,
  });

  it("recebido só dos concluídos; previsto ignora faltas; ticket médio dos concluídos", () => {
    const s = summarize([
      row("Gel", 10000),
      row("Gel", 10000),
      row("Pé", 5000, "confirmed"),
      row("Mão", 4000, "no_show"),
    ]);
    expect(s).toMatchObject({ received: 20000, forecast: 25000, doneCount: 2, averageCents: 10000 });
    expect(s.slices).toEqual([{ name: "Gel", cents: 20000 }]);
  });
  it("atendimento com dois serviços conta nas duas fatias, com o desconto dividido", () => {
    const s = summarize([
      {
        ...row("Escova + Hidratação", 13500),
        serviceParts: [
          { name: "Escova", cents: 8000 },
          { name: "Hidratação", cents: 7000 },
        ],
      },
      { ...row("Escova", 8000), serviceParts: JSON.stringify([{ name: "Escova", cents: 8000 }]) },
    ]);
    expect(s.received).toBe(21500);
    expect(s.slices).toEqual([
      { name: "Escova", cents: 8000 + 7200 },
      { name: "Hidratação", cents: 6300 },
    ]);
  });
  it("mais de 6 serviços: os 5 maiores e o resto em Outros", () => {
    const s = summarize(["A", "B", "C", "D", "E", "F", "G"].map((n, i) => row(n, (10 - i) * 100)));
    expect(s.slices.map((x) => x.name)).toEqual(["A", "B", "C", "D", "E", "Outros"]);
    expect(s.slices.at(-1)!.cents).toBe(500 + 400);
  });
});
