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

  const call = (auth?: string, qs = "") =>
    srv.handleAtalho(
      new Request(`http://x/api/v1/atalhos/proxima${qs}`, {
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
    const res = await call(`Bearer ${tokA}`);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe("Ana Souza");
    expect(await (await call(`Bearer ${tokB}`)).text()).toBe("Bia Lima");
    // JSON só quando pedido
    expect(await (await call(`Bearer ${tokB}`, "?formato=json")).json()).toEqual({ fala: "Bia Lima" });
  });

  it("sem chave, chave errada ou desligada: o mesmo 401", async () => {
    for (const auth of [undefined, `Bearer ${newApiToken()}`, `Bearer ${tokOff}`, "Basic abc"]) {
      const res = await call(auth);
      expect(res.status).toBe(401);
      expect(await res.text()).toContain("não está mais ligado");
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

  describe("pareamento (Adicionar à Siri)", () => {
    const pair = (body: string, type = "application/json") =>
      srv.handlePairing(
        new Request("http://x/api/v1/atalhos/parear", {
          method: "POST",
          body,
          headers: { "content-type": type, "x-forwarded-for": "5.6.7.8" },
        }),
      );

    it("troca o código pela chave uma vez só, e a chave lê o estúdio certo", async () => {
      const { newPairingCode, hashApiToken: h } = await import("@/features/atalhos/token");
      const code = newPairingCode();
      await admin`insert into api_tokens (tenant_id,name,token_hash,last4,pairing_expires_at)
        values (${B},'iPhone',${h(code)},${code.slice(-4)},now() + interval '15 minutes')`;
      // Pendente ainda não abre a agenda
      expect((await call(`Bearer ${code}`)).status).toBe(401);

      const res = await pair(JSON.stringify({ codigo: code }));
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toContain("no-store");
      const token = await res.text();
      expect(token).toMatch(/^bub_[A-Za-z0-9_-]{43}$/);
      expect(await (await call(`Bearer ${token}`)).text()).toBe("Bia Lima");

      // Uso único
      const again = await pair(JSON.stringify({ codigo: code }));
      expect(again.status).toBe(400);
      expect(await again.text()).toContain("venceu");
      const [row] = await admin`select pairing_expires_at from api_tokens where token_hash = ${h(token)}`;
      expect(row!.pairing_expires_at).toBeNull();
    });

    it("código vencido, desligado ou lixo: 400 com a frase", async () => {
      const { newPairingCode, hashApiToken: h } = await import("@/features/atalhos/token");
      const old = newPairingCode();
      const off = newPairingCode();
      await admin`insert into api_tokens (tenant_id,name,token_hash,last4,pairing_expires_at)
        values (${B},'iPhone',${h(old)},${old.slice(-4)},now() - interval '1 minute')`;
      await admin`insert into api_tokens (tenant_id,name,token_hash,last4,pairing_expires_at,revoked_at)
        values (${B},'iPhone',${h(off)},${off.slice(-4)},now() + interval '15 minutes',now())`;
      for (const body of [JSON.stringify({ codigo: old }), off, "lixo", "{"]) {
        const res = await pair(body, "text/plain");
        expect(res.status).toBe(400);
      }
    });
  });
});
