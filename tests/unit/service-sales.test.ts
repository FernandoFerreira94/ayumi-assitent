import { describe, expect, it } from "vitest";
import { salesByService } from "@/features/services/stats";

describe("salesByService", () => {
  it("conta o atendimento antigo (sem partes) no serviço principal", () => {
    const m = salesByService([{ priceCents: 5000, serviceId: "a", parts: null }]);
    expect(m.get("a")).toEqual({ count: 1, cents: 5000 });
  });

  it("divide o valor cobrado entre os serviços na proporção do preço cheio", () => {
    const m = salesByService([
      {
        priceCents: 9000,
        serviceId: "a",
        parts: JSON.stringify([
          { name: "a", cents: 6000 },
          { name: "b", cents: 4000 },
        ]),
      },
      { priceCents: 6000, serviceId: "a", parts: [{ name: "a", cents: 6000 }] },
    ]);
    expect(m.get("a")).toEqual({ count: 2, cents: 5400 + 6000 });
    expect(m.get("b")).toEqual({ count: 1, cents: 3600 });
  });
});
