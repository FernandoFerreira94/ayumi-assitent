// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { todayStr } from "@/lib/dates";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("promoção de desconto no agendamento (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, T2: string, unha: string, pe: string;
  const cli: string[] = [];
  let withTenant: typeof import("@/db/client").withTenant;
  let core: typeof import("@/features/appointments/core");
  let promos: typeof import("@/features/wallet/promotions");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    core = await import("@/features/appointments/core");
    promos = await import("@/features/wallet/promotions");
    admin = postgres(url!, { max: 1 });
    [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio Promo') returning id`;
    [{ id: T2 }] = await admin`insert into tenants (name) values ('Outro Promo') returning id`;
    [{ id: unha }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Unha',30,5000) returning id`;
    [{ id: pe }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Pé',30,4000) returning id`;
    for (let i = 0; i < 6; i++) {
      const [{ id }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${T},${"C" + i},${"+55119888800" + i}) returning id`;
      cli.push(id);
    }
  });
  afterAll(async () => admin.end());

  let slot = 0;
  const book = (clientId: string, extra: Partial<Parameters<typeof core.insertAppointment>[2]> = {}) => {
    const n = slot++;
    return withTenant(T, (tx) =>
      core.insertAppointment(tx, T, {
        clientId,
        serviceIds: [unha, pe],
        date: `2031-0${1 + Math.floor(n / 20)}-${String(1 + (n % 20)).padStart(2, "0")}`,
        time: "10:00",
        usePromotion: true,
        ...extra,
      }),
    );
  };
  const create = (maxClients: number | null, extra: Partial<{ startsOn: string | null }> = {}) =>
    withTenant(T, (tx) =>
      promos.createPromotion(tx, T, {
        name: "Natal",
        discount: { kind: "pct", value: 20 },
        serviceIds: [unha],
        startsOn: null,
        endsOn: null,
        maxClients,
        ...extra,
      }),
    );

  it("as 2 primeiras ganham 20% só no serviço da promoção; 1 por cliente; esgota", async () => {
    const id = (await create(2))!;
    const a = await book(cli[0]!);
    if (!a.ok) throw new Error(a.code);
    expect(a.data.promotion).toMatchObject({ name: "Natal", offCents: 1000, used: 1, maxClients: 2 });
    const [row] =
      await admin`select price_cents, discount_cents, discount_kind, promotion_id from appointments where id = ${a.data.id}`;
    expect(row).toMatchObject({ price_cents: 8000, discount_cents: 1000, discount_kind: "brl", promotion_id: id });

    const again = await book(cli[0]!);
    expect(again.ok && again.data.promotion).toBe(null);
    const b = await book(cli[1]!);
    expect(b.ok && b.data.promotion?.used).toBe(2);
    const c = await book(cli[2]!);
    expect(c.ok && c.data.promotion).toBe(null);
    const [p] = (await withTenant(T, (tx) => promos.listPromotions(tx))).filter((x) => x.id === id);
    expect(p!.used).toBe(2);

    // cancelar libera a vaga
    if (!b.ok) throw new Error();
    await withTenant(T, (tx) => core.setStatus(tx, b.data.id, "cancelled"));
    const c2 = await book(cli[2]!);
    expect(c2.ok && c2.data.promotion?.used).toBe(2);
    await withTenant(T, (tx) => promos.endPromotion(tx, id));
  });

  it("não entra sem pedir, com desconto digitado, pausada ou antes de começar", async () => {
    const id = (await create(null))!;
    expect((await book(cli[3]!, { usePromotion: false })).ok && true).toBe(true);
    const manual = await book(cli[3]!, { discount: { kind: "brl", value: 500 } });
    expect(manual.ok && manual.data.promotion).toBe(null);
    await withTenant(T, (tx) => promos.setPromotionPaused(tx, id, true));
    const paused = await book(cli[3]!);
    expect(paused.ok && paused.data.promotion).toBe(null);
    await withTenant(T, (tx) => promos.setPromotionPaused(tx, id, false));
    const back = await book(cli[3]!);
    expect(back.ok && back.data.promotion?.offCents).toBe(1000);
    await withTenant(T, (tx) => promos.endPromotion(tx, id));
    expect(await withTenant(T, (tx) => promos.setPromotionPaused(tx, id, true))).toBe(false);

    const later = (await create(null, { startsOn: "2099-01-01" }))!;
    const early = await book(cli[4]!);
    expect(early.ok && early.data.promotion).toBe(null);
    await withTenant(T, (tx) => promos.endPromotion(tx, later));
  });

  it("corrida: 3 agendando ao mesmo tempo numa promoção de 1 vaga, só 1 ganha", async () => {
    const id = (await create(1))!;
    const [{ id: c6 }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'R1','+5511977000001') returning id`;
    const [{ id: c7 }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'R2','+5511977000002') returning id`;
    const [{ id: c8 }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'R3','+5511977000003') returning id`;
    const res = await Promise.all([book(c6), book(c7), book(c8)]);
    expect(res.every((r) => r.ok)).toBe(true);
    expect(res.filter((r) => r.ok && r.data.promotion).length).toBe(1);
    const [{ n }] = await admin`select count(*)::int as n from appointments where promotion_id = ${id}`;
    expect(n).toBe(1);
  });

  it("outro estúdio não vê a promoção (RLS)", async () => {
    expect(await withTenant(T2, (tx) => promos.listPromotions(tx))).toEqual([]);
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
