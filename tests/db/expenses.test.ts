// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("gastos do financeiro (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let fin: typeof import("@/features/finance/expenses");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    fin = await import("@/features/finance/expenses");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('Estúdio A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('Estúdio B') returning id`;
  });
  afterAll(async () => admin.end());

  const input = (spentOn: string, amount: string, category = "produtos") =>
    fin.expenseInput.parse({ spentOn, amount, category });

  it("lista só o mês pedido do estúdio e remove", async () => {
    await withTenant(A, async (tx) => {
      await fin.insertExpense(tx, A, input("2026-11-01", "100,00"));
      await fin.insertExpense(tx, A, input("2026-11-30", "50,50", "aluguel"));
      await fin.insertExpense(tx, A, input("2026-12-01", "10,00"));
    });
    await withTenant(B, (tx) => fin.insertExpense(tx, B, input("2026-11-10", "999,00")));

    const nov = await withTenant(A, (tx) => fin.listExpenses(tx, "2026-11-01", "2026-12-01"));
    expect(nov.map((e) => e.amountCents)).toEqual([5050, 10000]);
    const asB = await withTenant(B, (tx) => fin.listExpenses(tx, "2026-11-01", "2026-12-01"));
    expect(asB.map((e) => e.amountCents)).toEqual([99900]);

    // B não consegue apagar gasto de A
    const gone = await withTenant(B, (tx) => fin.removeExpense(tx, nov[0].id));
    expect(gone).toHaveLength(0);
    const removed = await withTenant(A, (tx) => fin.removeExpense(tx, nov[0].id));
    expect(removed).toHaveLength(1);
  });

  it("o banco recusa valor zero e categoria desconhecida", async () => {
    await expect(
      admin`insert into expenses (tenant_id, spent_on, amount_cents, category) values (${A}, '2026-11-01', 0, 'produtos')`,
    ).rejects.toThrow();
    await expect(
      admin`insert into expenses (tenant_id, spent_on, amount_cents, category) values (${A}, '2026-11-01', 100, 'luxo')`,
    ).rejects.toThrow();
  });
});
