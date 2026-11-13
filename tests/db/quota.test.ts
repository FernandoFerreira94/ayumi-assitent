// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("limite diário de mensagens manuais (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let overDailyLimit: typeof import("@/features/messaging/quota").overDailyLimit;
  let withTenant: typeof import("@/db/client").withTenant;
  let T: string, T2: string, C: string;
  // 13:00 em Brasília
  const now = new Date("2026-11-10T16:00:00Z");

  beforeAll(async () => {
    ({ overDailyLimit } = await import("@/features/messaging/quota"));
    ({ withTenant } = await import("@/db/client"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('Q') returning id`;
    [{ id: T2 }] = await admin`insert into tenants (name) values ('Q2') returning id`;
    [{ id: C }] = await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Cli','+5511900000001') returning id`;
    // Ontem à noite (Brasília) não conta; hoje conta 3
    await admin`insert into messages (tenant_id,client_id,direction,kind,body,created_at) values
      (${T},${C},'out','manual','a','2026-11-10T02:00:00Z'),
      (${T},${C},'out','manual','b','2026-11-10T12:00:00Z'),
      (${T},${C},'out','manual','c','2026-11-10T13:00:00Z'),
      (${T},${C},'out','auto_reply','d','2026-11-10T13:30:00Z'),
      (${T},${C},'out','manual','e','2026-11-10T15:00:00Z')`;
  });
  afterAll(async () => admin.end());

  it("conta só as manuais do dia, do próprio estúdio", async () => {
    expect(await withTenant(T, (tx) => overDailyLimit(tx, now, 3))).toBe(true);
    expect(await withTenant(T, (tx) => overDailyLimit(tx, now, 4))).toBe(false);
    expect(await withTenant(T2, (tx) => overDailyLimit(tx, now, 1))).toBe(false);
  });
});
