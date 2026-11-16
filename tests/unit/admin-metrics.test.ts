import { describe, expect, it } from "vitest";
import { demoEvents, demoMrr, demoOverview, demoPayments, monthKey, shiftMonth } from "@/features/admin/demo-data";
import {
  cancellations,
  delinquencyBuckets,
  healthLevel,
  receivedInMonth,
  summarize,
  trialConversion,
  trialsEnding,
  upcomingDue,
} from "@/features/admin/metrics";
import type { OverviewRow, PaymentRow } from "@/features/admin/types";

const NOW = new Date("2026-11-16T15:00:00Z");
const DAY = 86_400_000;

function row(p: Partial<OverviewRow>): OverviewRow {
  return {
    tenantId: "t",
    salonName: "S",
    ownerName: "O",
    ownerEmail: "o@exemplo.test",
    planId: "individual",
    planName: "Individual",
    planKind: "individual",
    planInterval: "month",
    status: "active",
    founder: false,
    paymentMethod: "card",
    seats: 1,
    activeProfessionals: 1,
    amountCents: 4990,
    mrrCents: 4990,
    trialEndsAt: null,
    currentPeriodEnd: null,
    nextDueAt: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    cancelReason: null,
    pastDueSince: null,
    daysPastDue: null,
    lastPaidAt: null,
    providerSubscriptionId: null,
    createdAt: NOW,
    ...p,
  };
}

describe("summarize", () => {
  it("MRR conta active e past_due; trial e cortesia ficam fora", () => {
    const s = summarize(
      [
        row({ mrrCents: 4990 }),
        row({ status: "past_due", mrrCents: 7980, daysPastDue: 3 }),
        row({ status: "trialing", mrrCents: 0, trialEndsAt: new Date(NOW.getTime() + 2 * DAY) }),
        row({ status: "trialing", mrrCents: 0, trialEndsAt: new Date(NOW.getTime() - DAY) }),
        row({ founder: true, amountCents: 0, mrrCents: 0 }),
      ],
      NOW,
    );
    expect(s.mrrCents).toBe(12970);
    expect(s.mrrAtRiskCents).toBe(7980);
    expect(s.payingCount).toBe(2);
    expect(s.courtesyCount).toBe(1);
    expect(s.trialCount).toBe(2);
    expect(s.trialsEndingSoon).toBe(1);
    expect(s.arpaCents).toBe(6485);
  });

  it("sem pagantes, ARPA é null", () => {
    expect(summarize([], NOW).arpaCents).toBeNull();
  });
});

describe("delinquencyBuckets", () => {
  it("separa por faixa e soma o valor", () => {
    const b = delinquencyBuckets([
      row({ daysPastDue: 1, mrrCents: 100 }),
      row({ daysPastDue: 7, mrrCents: 200 }),
      row({ daysPastDue: 8, mrrCents: 300 }),
      row({ daysPastDue: 31, mrrCents: 400 }),
      row({ daysPastDue: 0, mrrCents: 999 }),
    ]);
    expect(b.map((x) => [x.count, x.mrrCents])).toEqual([
      [2, 300],
      [1, 300],
      [1, 400],
    ]);
  });
});

describe("upcomingDue", () => {
  it("só os próximos N dias, em ordem, sem quem cancela", () => {
    const a = row({ tenantId: "a", nextDueAt: new Date(NOW.getTime() + 5 * DAY) });
    const b = row({ tenantId: "b", nextDueAt: new Date(NOW.getTime() + DAY) });
    const c = row({ tenantId: "c", nextDueAt: new Date(NOW.getTime() + 2 * DAY), cancelAtPeriodEnd: true });
    const d = row({ tenantId: "d", nextDueAt: new Date(NOW.getTime() + 9 * DAY) });
    expect(upcomingDue([a, b, c, d], NOW, 7).map((r) => r.tenantId)).toEqual(["b", "a"]);
  });
});

describe("receivedInMonth", () => {
  it("líquido = bruto − taxa dos aprovados; estorno à parte", () => {
    const p = (status: PaymentRow["status"], amount: number, fee: number | null) =>
      ({ status, amountCents: amount, feeCents: fee }) as PaymentRow;
    const r = receivedInMonth([p("approved", 4990, 248), p("approved", 7980, 79), p("refunded", 4990, 248), p("rejected", 4990, null)]);
    expect(r).toEqual({ grossCents: 12970, feeCents: 327, netCents: 12643, refundedCents: 4990, approvedCount: 2 });
  });
});

describe("trialConversion", () => {
  it("conta cada salão uma vez e calcula a taxa", () => {
    const at = new Date(NOW.getTime() - DAY);
    const e = (tenantId: string, kind: "activated" | "read_only") =>
      ({ tenantId, kind, at }) as Parameters<typeof trialConversion>[0][number];
    const r = trialConversion([e("a", "activated"), e("b", "read_only"), e("a", "activated")], new Date(NOW.getTime() - 30 * DAY), NOW);
    expect(r).toEqual({ ended: 2, converted: 1, rate: 0.5 });
    expect(trialConversion([], NOW, NOW).rate).toBeNull();
  });
});

describe("healthLevel", () => {
  it("verde, laranja e vermelho", () => {
    const recent = new Date(NOW.getTime() - 60_000);
    expect(healthLevel({ lastEventAt: recent, pendingCount: 0, failed24h: 0, oldestPendingAt: null }, NOW)).toBe("ok");
    expect(healthLevel({ lastEventAt: recent, pendingCount: 2, failed24h: 0, oldestPendingAt: recent }, NOW)).toBe("warn");
    expect(healthLevel({ lastEventAt: null, pendingCount: 0, failed24h: 0, oldestPendingAt: null }, NOW)).toBe("warn");
    expect(healthLevel({ lastEventAt: recent, pendingCount: 0, failed24h: 1, oldestPendingAt: null }, NOW)).toBe("fail");
    const old = new Date(NOW.getTime() - 2 * 3_600_000);
    expect(healthLevel({ lastEventAt: recent, pendingCount: 1, failed24h: 0, oldestPendingAt: old }, NOW)).toBe("fail");
  });
});

describe("dados de exemplo", () => {
  it("são estáveis e coerentes com as regras", () => {
    const rows = demoOverview(NOW);
    expect(rows).toHaveLength(24);
    expect(demoOverview(NOW)).toEqual(rows);
    expect(rows.every((r) => r.ownerEmail.endsWith("@exemplo.test"))).toBe(true);
    const s = summarize(rows, NOW);
    expect(s.mrrCents).toBeGreaterThan(0);
    expect(s.pastDueCount).toBe(3);
    const mrr = demoMrr(NOW);
    expect(mrr).toHaveLength(12);
    expect(mrr.at(-1)!.mrrCents).toBe(s.mrrCents);
    expect(mrr.at(-1)!.month).toBe(`${monthKey(NOW)}-01`);
    expect(demoPayments(NOW, shiftMonth(monthKey(NOW), 1))).toEqual([]);
    expect(demoPayments(NOW, shiftMonth(monthKey(NOW), -1)).length).toBeGreaterThan(0);
    expect(trialsEnding(rows, NOW, 3).every((r) => r.status === "trialing")).toBe(true);
    expect(cancellations(demoEvents(NOW), new Date(NOW.getTime() - 30 * DAY), NOW).length).toBeGreaterThan(0);
  });

  it("shiftMonth atravessa o ano", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});
