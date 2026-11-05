// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("importação de clientes (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let core: typeof import("@/features/contacts/core");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    core = await import("@/features/contacts/core");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('B') returning id`;
    await admin`insert into clients (tenant_id,name,phone_e164) values (${A},'Já Existe','+5511911112222')`;
    await admin`insert into clients (tenant_id,name,phone_e164) values (${B},'Outro Estúdio','+5511922223333')`;
  });
  afterAll(async () => admin.end());

  it("marca existentes só do próprio estúdio e ignora repetidas ao importar", async () => {
    const list = [
      { name: "Já Existe", phone: "+5511911112222" },
      { name: "Bia", phone: "+5511922223333" },
      { name: "Cris", phone: "+5511933334444" },
    ];
    const prev = await withTenant(A, (tx) => core.markExisting(tx, list));
    expect(prev.map((p) => p.exists)).toEqual([true, false, false]);
    const r = await withTenant(A, (tx) => core.importClients(tx, A, list));
    expect(r).toEqual({ created: 2, skipped: 1 });
    expect(await withTenant(A, (tx) => core.importClients(tx, A, list))).toEqual({ created: 0, skipped: 3 });
    expect(await withTenant(A, (tx) => core.importClients(tx, A, []))).toEqual({ created: 0, skipped: 0 });
  });
});
