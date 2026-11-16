// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PushGoneError, type PushPort, type PushTarget } from "@/features/push/port";
import { assertTestDatabase } from "../db-guard";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("avisos do dono (Postgres real)", () => {
  let db: ReturnType<typeof postgres>;
  let alerts: typeof import("@/features/admin/alerts");
  const ADMIN = "alerts-admin-u";
  const OTHER = "alerts-other-u";
  let T = "";

  beforeAll(async () => {
    assertTestDatabase();
    db = postgres(url!, { max: 1, onnotice: () => {} });
    alerts = await import("@/features/admin/alerts");
    await db`truncate tenants cascade`;
    await db`delete from "user" where id in (${ADMIN}, ${OTHER})`;
    await db`insert into "user" (id, name, email) values (${ADMIN}, 'Dono', 'dono-alerts@t.test'), (${OTHER}, 'Ana', 'ana-alerts@t.test')`;
    [{ id: T }] = await db`insert into tenants (name, whatsapp_instance, created_at)
      values ('Novo', 'inst-down', now() - interval '1 day') returning id`;
    await db`insert into tenants (name, whatsapp_instance, created_at) values ('Velho parado', 'inst-ok', now() - interval '30 days')`;
    await db`insert into memberships (user_id, tenant_id) values (${OTHER}, ${T}), (${ADMIN}, ${T})`;
    await db`insert into session (id, "expiresAt", token, "userId", "updatedAt")
      values ('alerts-s', now() + interval '1 day', 'tok-alerts', ${OTHER}, now() - interval '1 day')`;
    const [{ id: S }] = await db`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    const [{ id: C }] = await db`insert into clients (tenant_id,name,phone_e164) values (${T},'X','+5511900000077') returning id`;
    await db`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,created_at)
      values (${T},${C},${S},now() + interval '2 days',now() + interval '2 days' + interval '1 hour',10000, now() - interval '1 day')`;
    await db`insert into messages (tenant_id,client_id,direction,kind,body,created_at) values
      (${T},${C},'out','reminder','a', now() - interval '1 day'), (${T},${C},'in','client','b', now() - interval '1 day')`;
    await db`insert into push_subscriptions (tenant_id, user_id, endpoint, p256dh, auth) values
      (${T}, ${ADMIN}, 'https://push.test/ok', 'k', 'a'), (${T}, ${ADMIN}, 'https://push.test/gone', 'k', 'a'),
      (${T}, ${OTHER}, 'https://push.test/other', 'k', 'a')`;
  });
  afterAll(async () => {
    await db`truncate tenants cascade`;
    await db`delete from "user" where id in (${ADMIN}, ${OTHER})`;
    await db.end();
  });

  it("manda só para os aparelhos de quem é admin e apaga a inscrição vencida", async () => {
    const sent: string[] = [];
    const push: PushPort = {
      async send(s: PushTarget) {
        if (s.endpoint.endsWith("/gone")) throw new PushGoneError();
        sent.push(s.endpoint);
      },
    };
    const r = await alerts.notifyAdmins(push, { title: "t", body: "b", url: "/admin" }, [ADMIN]);
    expect(r).toEqual({ sent: 1, removed: 1, failed: 0 });
    expect(sent).toEqual(["https://push.test/ok"]);
    expect(await db`select 1 from push_subscriptions where endpoint = 'https://push.test/gone'`).toHaveLength(0);
    expect(await alerts.notifyAdmins(push, { title: "t", body: "b", url: "/" }, [])).toEqual({ sent: 0, removed: 0, failed: 0 });
  });

  it("resumo de ontem: novos, ativos, agendamentos, mensagens, parados e WhatsApp caído", async () => {
    const wa = { state: async (i: string) => (i === "inst-down" ? "close" : "open") } as never;
    expect(await alerts.collectDigest(new Date(), wa)).toEqual({
      newSalons: 1,
      activeSalons: 1,
      appointments: 1,
      messagesOut: 1,
      whatsappDown: 1,
      idleSalons: 1,
    });
    expect((await alerts.collectDigest(new Date(), null)).whatsappDown).toBe(0);
  });
});
