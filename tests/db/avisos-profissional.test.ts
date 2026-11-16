// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Member } from "@/features/push/recipients";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

/** Push e avisos do dia para a pessoa certa (A5): atendimento vai à profissional dele + dona/admin. */
d("avisos e push por profissional (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, svc: string, ana: string, bia: string, carla: string;
  let cliAna: string, cliBia: string, cliCarla: string;
  const sfx = Date.now();
  const u = { dona: `a5-dona-${sfx}`, gerente: `a5-ger-${sfx}`, ana: `a5-ana-${sfx}`, bia: `a5-bia-${sfx}` };
  const members: Member[] = [];
  let db: typeof import("@/db/client");
  let push: typeof import("@/features/push/core");
  let noReply: typeof import("@/features/reminders/no-reply");
  let notices: typeof import("@/features/owner-notices/core");
  let reminders: typeof import("@/features/reminders/core");

  const sent: { endpoint: string; title: string; body: string; url: string }[] = [];
  const port = { send: async (s: { endpoint: string }, p: { title: string; body: string; url: string }) => void sent.push({ endpoint: s.endpoint, ...p }) };
  const who = (e: string) => e.split("/").pop()!;
  const recipients = () => sent.map((s) => who(s.endpoint)).sort();

  const appt = async (prof: string, cli: string, startsAt: Date, extra: Record<string, unknown> = {}) => {
    const [{ id }] = await admin`insert into appointments (tenant_id, professional_id, client_id, service_id, starts_at, ends_at, price_cents, status)
      values (${T}, ${prof}, ${cli}, ${svc}, ${startsAt}, ${new Date(startsAt.getTime() + 3_600_000)}, 8000, 'pending_confirmation') returning id`;
    if (extra.reminder) await admin`update appointments set reminder_sent_at = ${extra.reminder as Date}, nudge_sent_at = ${extra.reminder as Date} where id = ${id}`;
    return id as string;
  };

  beforeAll(async () => {
    db = await import("@/db/client");
    push = await import("@/features/push/core");
    noReply = await import("@/features/reminders/no-reply");
    notices = await import("@/features/owner-notices/core");
    reminders = await import("@/features/reminders/core");
    admin = postgres(url!, { max: 1 });
    [{ id: T }] = await admin`insert into tenants (name) values (${"Salão A5 " + sfx}) returning id`;
    [{ id: svc }] = await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    const cli = async (n: string, i: number) =>
      (await admin`insert into clients (tenant_id,name,phone_e164) values (${T},${n},${"+5511" + String(sfx).slice(-8) + i}) returning id`)[0].id as string;
    cliAna = await cli("Cliente da Ana", 1);
    cliBia = await cli("Cliente da Bia", 2);
    cliCarla = await cli("Cliente da Carla", 3);
    [{ id: ana }] = await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Ana',0) returning id`;
    [{ id: bia }] = await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Bia',1) returning id`;
    [{ id: carla }] = await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Carla',2) returning id`; // sem login
    for (const [k, id] of Object.entries(u))
      await admin`insert into "user" (id, name, email, "createdAt") values (${id}, ${k}, ${id + "@x.com"}, now())`;
    const mk = async (k: keyof typeof u, role: Member["role"], prof: string | null) => {
      await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${u[k]}, ${T}, ${role}, ${prof})`;
      await admin`insert into push_subscriptions (tenant_id, user_id, endpoint, p256dh, auth) values (${T}, ${u[k]}, ${"https://push.test/" + k}, 'p', 'a')`;
      members.push({ userId: u[k], role, professionalId: prof });
    };
    await mk("dona", "owner", null);
    await mk("gerente", "admin", null);
    await mk("ana", "professional", ana);
    await mk("bia", "professional", bia);
  });
  afterAll(async () => {
    await admin`delete from tenants where id = ${T}`;
    for (const id of Object.values(u)) await admin`delete from "user" where id = ${id}`;
    await admin.end();
  });

  const only = (...ks: (keyof typeof u)[]) => new Set(ks.map((k) => u[k]));

  it("sendToAll com filtro só avisa os logins escolhidos", async () => {
    sent.length = 0;
    await db.withTenant(T, (tx) => push.sendToAll(tx, port, { title: "t", body: "b", url: "/x" }, only("ana", "dona")));
    expect(recipients()).toEqual(["ana", "dona"]);
    sent.length = 0;
    await db.withTenant(T, (tx) => push.sendToAll(tx, port, { title: "t", body: "b", url: "/x" }));
    expect(recipients()).toEqual(["ana", "bia", "dona", "gerente"]);
  });

  it("não respondeu: vai à profissional do atendimento e à dona/admin", async () => {
    const now = new Date("2030-05-10T15:00:00Z");
    await appt(ana, cliAna, new Date("2030-05-10T18:00:00Z"), { reminder: new Date("2030-05-10T10:00:00Z") });
    sent.length = 0;
    await db.withTenant(T, (tx) => noReply.notifyNoReplies(tx, port, now, 3, members));
    expect(recipients()).toEqual(["ana", "dona", "gerente"]);
  });

  it("não respondeu de profissional sem login: só dona/admin", async () => {
    const now = new Date("2030-05-11T15:00:00Z");
    await appt(carla, cliCarla, new Date("2030-05-11T18:00:00Z"), { reminder: new Date("2030-05-11T10:00:00Z") });
    sent.length = 0;
    await db.withTenant(T, (tx) => noReply.notifyNoReplies(tx, port, now, 3, members));
    expect(recipients()).toEqual(["dona", "gerente"]);
  });

  it("1º aviso traz o nome da profissional, vazio quando o salão tem uma só", async () => {
    const now = new Date("2030-06-10T12:00:00Z");
    await appt(bia, cliBia, new Date("2030-06-11T12:00:00Z"));
    const due = await db.withTenant(T, (tx) => reminders.claimDue(tx, now, 24));
    expect(due.map((x) => x.professional)).toEqual(["Bia"]);
    await admin`update appointments set reminder_sent_at = null where tenant_id = ${T} and starts_at = '2030-06-11T12:00:00Z'`;
    await admin`update professionals set active = false where id in (${bia}, ${carla})`;
    const solo = await db.withTenant(T, (tx) => reminders.claimDue(tx, now, 24));
    expect(solo.map((x) => x.professional)).toEqual([""]);
    await admin`update professionals set active = true where id in (${bia}, ${carla})`;
  });

  it("aviso da manhã: dona vê o salão, profissional só a própria agenda", async () => {
    // sexta 08:00 em SP; Ana atende às 10h, Bia às 14h e 15h
    const now = new Date("2030-09-06T11:00:00Z");
    await appt(ana, cliAna, new Date("2030-09-06T13:00:00Z"));
    await appt(bia, cliBia, new Date("2030-09-06T17:00:00Z"));
    await appt(bia, cliBia, new Date("2030-09-06T18:00:00Z"));
    sent.length = 0;
    const salon = { name: "S", ownerName: null, city: null, state: null, latitude: null, longitude: null };
    await db.withTenant(T, (tx) =>
      notices.runTenantNotices(tx, T, port, now, salon, { ai: null, forecast: async () => null, members }),
    );
    const body = (k: string) => sent.find((s) => who(s.endpoint) === k)?.body;
    expect(body("dona")).toContain("3 clientes");
    expect(body("gerente")).toContain("3 clientes");
    expect(body("ana")).toContain("1 cliente,");
    expect(body("bia")).toContain("2 clientes");
  });
});
