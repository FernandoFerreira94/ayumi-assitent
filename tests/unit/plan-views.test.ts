import { describe, expect, it } from "vitest";
import { groupSold, planTotals, soldState } from "@/features/wallet/plan-views";

const today = "2030-08-10";
const p = (id: string, left: number, expiresOn: string | null, clientId = id) => ({
  id,
  clientId,
  left,
  expiresOn,
});

describe("página Planos", () => {
  it("situação do pacote vendido", () => {
    expect(soldState(p("a", 3, "2030-12-01"), today)).toBe("active");
    expect(soldState(p("a", 1, "2030-12-01"), today)).toBe("ending");
    expect(soldState(p("a", 3, "2030-08-17"), today)).toBe("ending");
    expect(soldState(p("a", 3, null), today)).toBe("active");
    expect(soldState(p("a", 0, "2030-12-01"), today)).toBe("finished");
    expect(soldState(p("a", 2, "2030-08-09"), today)).toBe("expired");
  });

  it("em uso primeiro com os que estão acabando no topo; acabados e vencidos à parte", () => {
    const g = groupSold([p("a", 3, null), p("b", 1, null), p("c", 0, null), p("d", 2, "2030-01-01")], today);
    expect(g.current.map((x) => x.id)).toEqual(["b", "a"]);
    expect(g.past.map((x) => x.id)).toEqual(["c", "d"]);
  });

  it("números do topo contam só o que está em uso", () => {
    const t = planTotals(
      [p("a", 3, null, "ana"), p("b", 1, null, "ana"), p("c", 0, null, "bia"), p("d", 2, "2030-01-01", "cris")],
      [{ status: "running" }, { status: "ended" }],
      [{ status: "running" }, { status: "paused" }, { status: "running" }],
      today,
    );
    expect(t).toEqual({ clients: 1, sessions: 4, forSale: 1, promotions: 2 });
  });
});
