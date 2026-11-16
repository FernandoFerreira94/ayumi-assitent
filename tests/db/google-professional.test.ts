// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// O Google de verdade não entra: a porta só anota com qual token foi aberta e o que recebeu.
const calls: { token: string; summary: string }[] = [];
let remoteEvents: Record<string, { id: string; title: string; startsAt: Date; endsAt: Date }[]> = {};
vi.mock("@/features/google/calendar", async (orig) => ({
  ...(await orig<typeof import("@/features/google/calendar")>()),
  googleCalendar: (token: string) => ({
    createEvent: async (e: { summary: string }) => {
      calls.push({ token, summary: e.summary });
      return `ev-${token}`;
    },
    updateEvent: async () => undefined,
    deleteEvent: async () => undefined,
  }),
  googleCalendarReader: (token: string) => ({ listEvents: async () => remoteEvents[token] ?? [] }),
}));

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("Google por profissional (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, svc: string, cli: string, ana: string, bia: string, carla: string, dani: string;
  const sfx = Date.now();
  const users = { ana: `g-ana-${sfx}`, bia: `g-bia-${sfx}`, dani: `g-dani-${sfx}`, dona: `g-dona-${sfx}` };
  let google: typeof import("@/features/google/server");
  let db: typeof import("@/db/client");

  const appt = async (professionalId: string, hour: number) => {
    const day = new Date("2030-05-10T00:00:00Z");
    const starts = new Date(day.getTime() + hour * 3_600_000);
    const [{ id }] =
      await admin`insert into appointments (tenant_id, professional_id, client_id, service_id, starts_at, ends_at, price_cents, status)
      values (${T}, ${professionalId}, ${cli}, ${svc}, ${starts}, ${new Date(starts.getTime() + 3_600_000)}, 8000, 'confirmed') returning id`;
    return id as string;
  };
  const eventOf = async (id: string) =>
    (await admin`select google_event_id from appointments where id = ${id}`)[0].google_event_id as string | null;

  beforeAll(async () => {
    google = await import("@/features/google/server");
    db = await import("@/db/client");
    admin = postgres(url!, { max: 1 });
    [{ id: T }] = await admin`insert into tenants (name) values (${"Salão Google " + sfx}) returning id`;
    [{ id: svc }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    [{ id: cli }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Cli',${"+5511" + String(sfx).slice(-9)}) returning id`;
    [{ id: ana }] =
      await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Ana',0) returning id`;
    [{ id: bia }] =
      await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Bia',1) returning id`;
    [{ id: carla }] =
      await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Carla',2) returning id`; // sem login
    [{ id: dani }] =
      await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Dani',3) returning id`; // login sem Google
    for (const [k, id] of Object.entries(users))
      await admin`insert into "user" (id, name, email, "createdAt") values (${id}, ${k}, ${id + "@x.com"}, now())`;
    await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${users.ana}, ${T}, 'professional', ${ana})`;
    await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${users.bia}, ${T}, 'professional', ${bia})`;
    await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${users.dani}, ${T}, 'professional', ${dani})`;
    for (const [k, tok] of [
      ["ana", "tok-ana"],
      ["bia", "tok-bia"],
    ] as const)
      await admin`insert into account (id, "accountId", "providerId", "userId", "accessToken", "accessTokenExpiresAt")
        values (${"acc-" + users[k]}, ${"gid-" + k}, 'google', ${users[k]}, ${tok}, now() + interval '1 hour')`;
  });
  afterAll(async () => {
    await admin`delete from tenants where id = ${T}`;
    for (const id of Object.values(users)) await admin`delete from "user" where id = ${id}`;
    await admin.end();
  });
  beforeEach(() => {
    calls.length = 0;
    remoteEvents = {};
  });

  it("o atendimento vai para a conta Google da profissional dele, não da outra", async () => {
    const a = await appt(ana, 12);
    const b = await appt(bia, 14);
    expect(await google.syncAppointmentSafe(T, b)).toBe("synced");
    expect(calls).toEqual([{ token: "tok-bia", summary: expect.stringContaining("Cli") }]);
    expect(await eventOf(b)).toBe("ev-tok-bia");
    expect(await google.syncAppointmentSafe(T, a)).toBe("synced");
    expect(calls.map((c) => c.token)).toEqual(["tok-bia", "tok-ana"]);
    expect(await eventOf(a)).toBe("ev-tok-ana");
  });

  it("profissional sem login, ou com login mas sem Google, não sincroniza e não dá erro", async () => {
    const semLogin = await appt(carla, 16);
    const semGoogle = await appt(dani, 17);
    expect(await google.syncAppointmentSafe(T, semLogin)).toBe("skipped");
    expect(await google.syncAppointmentSafe(T, semGoogle)).toBe("skipped");
    expect(calls).toHaveLength(0);
    expect(await eventOf(semLogin)).toBeNull();
    expect(await eventOf(semGoogle)).toBeNull();
  });

  it("isGoogleConnected e a lista de profissionais conectadas olham o vínculo de cada uma", async () => {
    expect(await google.isGoogleConnected(ana)).toBe(true);
    expect(await google.isGoogleConnected(bia)).toBe(true);
    expect(await google.isGoogleConnected(carla)).toBe(false);
    expect(await google.isGoogleConnected(dani)).toBe(false);
    expect((await google.connectedProfessionalIds(T)).sort()).toEqual([ana, bia].sort());
  });

  it("importar: cada evento vira bloqueio da profissional dona da conta e um import não apaga o da outra", async () => {
    const at = (h: number) => new Date(Date.now() + 2 * 86_400_000 + h * 3_600_000);
    remoteEvents = {
      "tok-ana": [{ id: "ea", title: "Dentista", startsAt: at(0), endsAt: at(1) }],
      "tok-bia": [{ id: "eb", title: "Banco", startsAt: at(3), endsAt: at(4) }],
    };
    await google.importExternalEvents(T, true);
    const rows = async () =>
      (await admin`select google_event_id as id, professional_id as p from blocks where tenant_id = ${T} and source = 'google' order by google_event_id`) as {
        id: string;
        p: string;
      }[];
    expect(await rows()).toEqual([
      { id: "ea", p: ana },
      { id: "eb", p: bia },
    ]);
    // a agenda da Ana esvaziou: some só o dela
    remoteEvents = { "tok-ana": [], "tok-bia": remoteEvents["tok-bia"] };
    await google.importExternalEvents(T, true);
    expect(await rows()).toEqual([{ id: "eb", p: bia }]);
  });

  it("dona sem profissional ligada usa o Google da profissional padrão do salão", async () => {
    const [{ id: T2 }] = await admin`insert into tenants (name) values (${"Salão novo " + sfx}) returning id`;
    try {
      await admin`insert into memberships (user_id, tenant_id, role) values (${users.dona}, ${T2}, 'owner')`;
      await admin`insert into account (id, "accountId", "providerId", "userId", "accessToken", "accessTokenExpiresAt")
        values (${"acc-" + users.dona}, 'gid-dona', 'google', ${users.dona}, 'tok-dona', now() + interval '1 hour')`;
      const first = await db.withTenant(T2, async (tx) => {
        const { defaultProfessionalId } = await import("@/features/team/professional");
        return defaultProfessionalId(tx, T2);
      });
      expect(await google.isGoogleConnected(first)).toBe(true);
      // e não vaza para as profissionais de outro salão
      expect(await google.isGoogleConnected(carla)).toBe(false);
    } finally {
      await admin`delete from tenants where id = ${T2}`;
    }
  });
});
