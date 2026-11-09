import { describe, expect, it } from "vitest";
import { applyDiscount, parseDiscount, splitTotal } from "@/features/appointments/pricing";

describe("desconto do agendamento", () => {
  it("aplica % e R$ sem passar do subtotal", () => {
    expect(applyDiscount(15000, null)).toEqual({ discountCents: 0, totalCents: 15000 });
    expect(applyDiscount(15000, { kind: "pct", value: 10 })).toEqual({ discountCents: 1500, totalCents: 13500 });
    expect(applyDiscount(9999, { kind: "pct", value: 15 })).toEqual({ discountCents: 1500, totalCents: 8499 });
    expect(applyDiscount(5000, { kind: "brl", value: 2000 })).toEqual({ discountCents: 2000, totalCents: 3000 });
    expect(applyDiscount(5000, { kind: "brl", value: 9000 })).toEqual({ discountCents: 5000, totalCents: 0 });
  });

  it("lê o que a pessoa digita", () => {
    expect(parseDiscount(null, "10")).toBeNull();
    expect(parseDiscount("pct", "")).toBeNull();
    expect(parseDiscount("pct", "10%")).toEqual({ kind: "pct", value: 10 });
    expect(parseDiscount("pct", "0")).toBe("invalid");
    expect(parseDiscount("pct", "101")).toBe("invalid");
    expect(parseDiscount("pct", "7,5")).toBe("invalid");
    expect(parseDiscount("brl", "15")).toEqual({ kind: "brl", value: 1500 });
    expect(parseDiscount("brl", "15,5")).toEqual({ kind: "brl", value: 1550 });
    expect(parseDiscount("brl", "R$ 1.015,50")).toEqual({ kind: "brl", value: 101550 });
    expect(parseDiscount("brl", "abc")).toBe("invalid");
    expect(parseDiscount("brl", "0")).toBe("invalid");
  });

  it("divide o total entre os serviços sem perder centavo", () => {
    const parts = [
      { name: "Escova", cents: 8000 },
      { name: "Hidratação", cents: 7000 },
    ];
    expect(splitTotal(15000, parts)).toEqual(parts);
    const off = splitTotal(13333, parts);
    expect(off.reduce((s, p) => s + p.cents, 0)).toBe(13333);
    expect(off[0]!.cents).toBeGreaterThan(off[1]!.cents);
    expect(splitTotal(100, [{ name: "A", cents: 0 }])).toEqual([{ name: "A", cents: 100 }]);
    expect(splitTotal(100, [])).toEqual([]);
  });
});
