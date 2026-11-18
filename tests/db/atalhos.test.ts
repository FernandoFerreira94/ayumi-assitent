// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashApiToken, newApiToken } from "@/features/atalhos/token";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("chave da Siri e Atalhos (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string;
  let srv: typeof import("@/features/atalhos/server");
  const tokA = newApiToken();
  const tokB = newApiToken();
  const tokOff = newApiToken();
  const start = new Date(Date.now() + 3_600_000);

  beforeAll(async () => {
    srv = await import("@/features/atalhos/server");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('Studio A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('Studio B') returning id`;
    for (const [t, client, tok] of [
      [A, "Ana Souza", tokA],
      [B, "Bia Lima", tokB],
    ] as const) {
      const [{ id: c }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${t},${client},${"+55119" + (t === A ? "1" : "2").repeat(8)}) returning id`;
      const [{ id: s }] =
        await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${t},'Corte',60,5000) returning id`;
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
        values (${t},${c},${s},${start},${new Date(start.getTime() + 3_600_000)},5000,'confirmed')`;
      await admin`insert into api_tokens (tenant_id,name,token_hash,last4) values (${t},'iPhone',${hashApiToken(tok)},${tok.slice(-4)})`;
    }
    await admin`insert into api_tokens (tenant_id,name,token_hash,last4,revoked_at)
      values (${A},'Velho',${hashApiToken(tokOff)},${tokOff.slice(-4)},now())`;
  });

  afterAll(async () => {
    await admin`truncate tenants cascade`;
    await admin.end();
  });

  const call = (auth?: string) =>
    srv.handleAtalho(
      new Request("http://x/api/v1/atalhos/proxima", {
        headers: auth ? { authorization: auth, "x-forwarded-for": "1.2.3.4" } : {},
      }),
      async (tenantId, now) => {
        const rows = await srv.loadRows(tenantId, [
          new Date(now.getTime() - 86_400_000),
          new Date(now.getTime() + 2 * 86_400_000),
        ]);
        return { fala: rows.map((r) => r.clientName).join(",") };
      },
    );

  it("cada chave lê só o próprio estúdio", async () => {
    expect(await (await call(`Bearer ${tokA}`)).json()).toEqual({ fala: "Ana Souza" });
    expect(await (await call(`Bearer ${tokB}`)).json()).toEqual({ fala: "Bia Lima" });
  });

  it("sem chave, chave errada ou desligada: o mesmo 401", async () => {
    for (const auth of [undefined, `Bearer ${newApiToken()}`, `Bearer ${tokOff}`, "Basic abc"]) {
      const res = await call(auth);
      expect(res.status).toBe(401);
      expect((await res.json()).fala).toContain("não está mais ligado");
    }
  });

  it("marca o último uso e não guarda a chave", async () => {
    const [row] =
      await admin`select last_used_at, token_hash from api_tokens where tenant_id = ${A} and revoked_at is null`;
    expect(row!.last_used_at).not.toBeNull();
    expect(row!.token_hash).not.toBe(tokA);
  });

  it("app_user de um estúdio não vê chave de outro (RLS)", async () => {
    const { withTenant } = await import("@/db/client");
    const { apiTokens } = await import("@/db/schema");
    const rows = await withTenant(A, (tx) => tx.select({ t: apiTokens.tenantId }).from(apiTokens));
    expect(rows.every((r) => r.t === A)).toBe(true);
    expect(rows).toHaveLength(2);
  });
});
