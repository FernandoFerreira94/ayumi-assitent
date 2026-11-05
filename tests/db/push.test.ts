// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("push (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let core: typeof import("@/features/push/core");
  let PushGoneError: typeof import("@/features/push/port").PushGoneError;

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    core = await import("@/features/push/core");
    ({ PushGoneError } = await import("@/features/push/port"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    await admin`delete from "user" where id in ('pu1','pu2')`;
    await admin`insert into "user" (id,name,email) values ('pu1','A','pu1@t.test'),('pu2','B','pu2@t.test')`;
    [{ id: A }] = await admin`insert into tenants (name) values ('A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('B') returning id`;
  });
  afterAll(async () => {
    await admin`delete from "user" where id in ('pu1','pu2')`;
    await admin.end();
  });

  it("isola por estúdio, é idempotente e avisa só quando há pendência", async () => {
    const mk = (e: string) => ({ endpoint: `https://push.test/${e}`, p256dh: "p", auth: "a" });
    await withTenant(A, (tx) => core.saveSubscription(tx, A, "pu1", mk("1")));
    await withTenant(A, (tx) => core.saveSubscription(tx, A, "pu1", mk("1"))); // repetida
    await withTenant(A, (tx) => core.saveSubscription(tx, A, "pu1", mk("2")));
    await withTenant(B, (tx) => core.saveSubscription(tx, B, "pu2", mk("3")));
    expect(await withTenant(A, (tx) => core.hasSubscription(tx, "pu1"))).toBe(true);
    expect(await withTenant(B, (tx) => core.hasSubscription(tx, "pu1"))).toBe(false);

    const sent: string[] = [];
    const ok = { send: async (s: { endpoint: string }) => void sent.push(s.endpoint) };
    const now = new Date("2026-11-10T12:00:00Z");

    // sem pendências: nada enviado
    expect(await withTenant(A, (tx) => core.notifyPendencias(tx, ok, now, false))).toEqual({
      sent: 0,
      removed: 0,
      failed: 0,
    });

    // agendamento que já passou e segue aberto = pendência
    const [{ id: svc }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${A},'S',60,1000) returning id`;
    const [{ id: cli }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${A},'C','+5511900007777') returning id`;
    await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${A},${cli},${svc},'2026-11-09T14:00:00Z','2026-11-09T15:00:00Z',1000,'confirmed')`;
    expect(await withTenant(A, (tx) => core.notifyPendencias(tx, ok, now, false))).toEqual({
      sent: 2,
      removed: 0,
      failed: 0,
    });
    expect(sent.sort()).toEqual(["https://push.test/1", "https://push.test/2"]);

    // inscrição expirada é removida; erro comum só conta falha
    const gone = {
      send: async (s: { endpoint: string }) => {
        if (s.endpoint.endsWith("/1")) throw new PushGoneError();
        throw new Error("x");
      },
    };
    expect(await withTenant(A, (tx) => core.notifyPendencias(tx, gone, now, false))).toEqual({
      sent: 0,
      removed: 1,
      failed: 1,
    });

    // descadastrar
    await withTenant(A, (tx) => core.removeSubscription(tx, "pu1", "https://push.test/2"));
    expect(await withTenant(A, (tx) => core.hasSubscription(tx, "pu1"))).toBe(false);
  });
});
