import { describe, expect, it } from "vitest";
import { summarizeUsage, type UsageRow } from "@/features/admin/usage-rules";

const NOW = new Date("2026-11-16T15:00:00Z");
const DAY = 86_400_000;
const row = (p: Partial<UsageRow>): UsageRow => ({
  tenantId: "t",
  salonName: "S",
  ownerName: null,
  createdAt: NOW,
  lastSeenAt: null,
  whatsapp: false,
  clients: 0,
  appts30: 0,
  msgsOut30: 0,
  msgsIn30: 0,
  ...p,
});

describe("summarizeUsage", () => {
  it("ativo = usou em até 7 dias; média de mensagens só entre os ativos", () => {
    const s = summarizeUsage(
      [
        row({ lastSeenAt: new Date(NOW.getTime() - DAY), whatsapp: true, appts30: 10, msgsOut30: 100 }),
        row({ lastSeenAt: new Date(NOW.getTime() - 7 * DAY), msgsOut30: 50 }),
        row({ lastSeenAt: new Date(NOW.getTime() - 8 * DAY), msgsOut30: 999 }),
        row({}),
      ],
      NOW,
    );
    expect(s).toEqual({ salons: 4, active7: 2, whatsapp: 1, appts30: 10, msgsOut30: 1149, msgsPerActive: 75 });
  });

  it("sem salão ativo, média é null", () => {
    expect(summarizeUsage([row({})], NOW).msgsPerActive).toBeNull();
  });
});
