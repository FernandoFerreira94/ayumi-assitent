// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("retenção de dados (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let runRetention: typeof import("@/features/retention/run").runRetention;

  beforeAll(async () => {
    ({ runRetention } = await import("@/features/retention/run"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    await admin`truncate access_log`;
  });
  afterAll(async () => admin.end());

  it("apaga acesso com mais de 200 dias e conversa com mais de 12 meses; mantém o resto", async () => {
    const [{ id: T }] = await admin`insert into tenants (name) values ('R') returning id`;
    const [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Cli','+5511900000009') returning id`;
    const now = new Date("2026-11-13T12:00:00Z");
    await admin`insert into access_log (user_id, created_at) values ('u', '2026-04-01T00:00:00Z'), ('u', '2026-10-01T00:00:00Z')`;
    await admin`insert into messages (tenant_id,client_id,direction,kind,body,created_at)
      values (${T},${C},'in','client','velha','2025-10-01T00:00:00Z'), (${T},${C},'in','client','nova','2026-10-01T00:00:00Z')`;
    const r = await runRetention(now);
    expect(r).toEqual({ accessLogs: 1, messages: 1 });
    expect((await admin`select body from messages`).map((m) => m.body)).toEqual(["nova"]);
    expect(await admin`select id from access_log`).toHaveLength(1);
  });
});
