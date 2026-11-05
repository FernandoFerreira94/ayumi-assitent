// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("multitenancy e agenda (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string, svcA: string, cliA: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let schema: typeof import("@/db/schema");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    schema = await import("@/db/schema");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('Estúdio A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('Estúdio B') returning id`;
    [{ id: svcA }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${A},'Alongamento',120,15000) returning id`;
    [{ id: cliA }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${A},'Maria','+5511999990000') returning id`;
  });
  afterAll(async () => admin.end());

  const appt = (start: string, end: string, status = "confirmed") => ({
    tenantId: A,
    clientId: cliA,
    serviceId: svcA,
    priceCents: 15000,
    startsAt: new Date(start),
    endsAt: new Date(end),
    status: status as "confirmed",
  });

  it("um estúdio não enxerga dados do outro", async () => {
    const asB = await withTenant(B, (tx) => tx.select().from(schema.clients));
    const asA = await withTenant(A, (tx) => tx.select().from(schema.clients));
    expect(asB).toHaveLength(0);
    expect(asA).toHaveLength(1);
  });

  it("sem estúdio ativo não retorna nada", async () => {
    const rows = await withTenant("00000000-0000-0000-0000-000000000000", (tx) => tx.select().from(schema.clients));
    expect(rows).toHaveLength(0);
  });

  it("não deixa gravar dado em nome de outro estúdio", async () => {
    await expect(
      withTenant(B, (tx) => tx.insert(schema.clients).values({ tenantId: A, name: "X", phoneE164: "+5511888880000" })),
    ).rejects.toThrow();
  });

  it("telefone duplicado no mesmo estúdio é recusado", async () => {
    await expect(
      withTenant(A, (tx) =>
        tx.insert(schema.clients).values({ tenantId: A, name: "Outra", phoneE164: "+5511999990000" }),
      ),
    ).rejects.toThrow();
  });

  it("impede agendamentos sobrepostos, mas permite colado e cancelado", async () => {
    await withTenant(A, (tx) =>
      tx.insert(schema.appointments).values(appt("2026-11-10T13:00:00Z", "2026-11-10T15:00:00Z")),
    );
    await expect(
      withTenant(A, (tx) =>
        tx.insert(schema.appointments).values(appt("2026-11-10T14:00:00Z", "2026-11-10T16:00:00Z")),
      ),
    ).rejects.toThrow();
    await withTenant(A, (tx) =>
      tx.insert(schema.appointments).values(appt("2026-11-10T15:00:00Z", "2026-11-10T16:00:00Z")),
    );
    await withTenant(A, (tx) =>
      tx.insert(schema.appointments).values(appt("2026-11-10T13:30:00Z", "2026-11-10T14:00:00Z", "cancelled")),
    );
  });
});
