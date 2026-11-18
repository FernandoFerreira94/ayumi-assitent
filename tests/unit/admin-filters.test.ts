import { describe, expect, it } from "vitest";
import { demoOverview } from "@/features/admin/demo-data";
import { filterSubscribers, inTab, sortSubscribers, TABS } from "@/features/admin/filters";

const NOW = new Date("2026-11-16T15:00:00Z");
const rows = demoOverview(NOW);

describe("filtros de assinantes", () => {
  it("abas batem com o status", () => {
    expect(filterSubscribers(rows, { tab: "atraso" }).every((r) => r.status === "past_due")).toBe(true);
    expect(filterSubscribers(rows, { tab: "teste" }).every((r) => r.status === "trialing")).toBe(true);
    expect(filterSubscribers(rows, { tab: "cortesia" }).every((r) => r.founder && r.amountCents === 0)).toBe(true);
    expect(filterSubscribers(rows, { tab: "todos" })).toHaveLength(rows.length);
    expect(TABS.map((t) => t.id)).toContain("so_leitura");
    expect(rows.filter((r) => inTab(r, "pagantes")).every((r) => r.mrrCents > 0)).toBe(true);
  });

  it("busca ignora acento e maiúscula, em salão ou dona", () => {
    expect(filterSubscribers(rows, { tab: "todos", q: "LIRIO" }).map((r) => r.salonName)).toEqual(["Studio Lírio"]);
    expect(filterSubscribers(rows, { tab: "todos", q: "katia" }).map((r) => r.ownerName)).toEqual(["Kátia Alves"]);
  });

  it("tipo e método", () => {
    expect(filterSubscribers(rows, { tab: "todos", kind: "empresa" }).every((r) => r.planKind === "empresa")).toBe(true);
    expect(filterSubscribers(rows, { tab: "todos", method: "pix" }).every((r) => r.paymentMethod === "pix")).toBe(true);
  });

  it("ordena por valor, atraso e vencimento (sem data vai pro fim)", () => {
    const v = sortSubscribers(rows, "valor");
    expect(v[0].mrrCents).toBeGreaterThanOrEqual(v[1].mrrCents);
    expect(sortSubscribers(rows, "atraso")[0].daysPastDue).toBe(38);
    expect(sortSubscribers(rows, "vencimento").at(-1)!.nextDueAt).toBeNull();
  });
});
