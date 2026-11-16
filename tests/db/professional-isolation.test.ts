// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { canAs, type Actor } from "@/features/team/permissions";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("isolamento entre profissionais do mesmo salão (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, svc: string, cli: string, ana: string, bia: string;
  let apptAna: string, apptBia: string, blockAna: string, blockSalao: string, listAna: string, listBia: string;
  const sufixo = Date.now();
  const users = {
    dona: `u-dona-${sufixo}`,
    gerente: `u-ger-${sufixo}`,
    ana: `u-ana-${sufixo}`,
    solta: `u-solta-${sufixo}`,
  };

  beforeAll(async () => {
    admin = postgres(url!, { max: 1 });
    [{ id: T }] = await admin`insert into tenants (name) values (${"Salão Equipe " + sufixo}) returning id`;
    [{ id: svc }] = await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    [{ id: cli }] = await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Cli',${"+5511" + String(sufixo).slice(-9)}) returning id`;
    [{ id: ana }] = await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Ana',0) returning id`;
    [{ id: bia }] = await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Bia',1) returning id`;
    for (const [k, id] of Object.entries(users))
      await admin`insert into "user" (id, name, email, "createdAt") values (${id}, ${k}, ${id + "@x.com"}, now())`;
    await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${users.dona}, ${T}, 'owner', ${ana})`;
    await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${users.gerente}, ${T}, 'admin', null)`;
    await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${users.ana}, ${T}, 'professional', ${ana})`;
    await admin`insert into memberships (user_id, tenant_id, role, professional_id) values (${users.solta}, ${T}, 'professional', null)`;

    const { withTenant } = await import("@/db/client");
    const { insertAppointment } = await import("@/features/appointments/core");
    const { insertBlock } = await import("@/features/blocks/core");
    const { saveSlotList } = await import("@/features/hours/slot-lists");
    const date = "2030-04-10";
    const config = { period: { kind: "next", days: 7 }, weekdays: [], from: "09:00", to: "18:00" };
    await withTenant(T, async (tx) => {
      const a = await insertAppointment(tx, T, { clientId: cli, serviceId: svc, date, time: "09:00", professionalId: ana });
      const b = await insertAppointment(tx, T, { clientId: cli, serviceId: svc, date, time: "09:00", professionalId: bia });
      if (!a.ok || !b.ok) throw new Error("setup de atendimentos falhou");
      apptAna = a.data.id;
      apptBia = b.data.id;
      const ba = await insertBlock(tx, T, { date, start: "13:00", end: "14:00", reason: "Dentista" }, ana);
      const bs = await insertBlock(tx, T, { date, start: "17:00", end: "18:00", reason: "Feriado" });
      if (!ba.ok || !bs.ok) throw new Error("setup de bloqueios falhou");
      blockAna = ba.data.id;
      blockSalao = bs.data.id;
      // O conteúdo da lista não importa aqui: só de quem ela é
      const cfg = config as unknown as Parameters<typeof saveSlotList>[2]["config"];
      const la = await saveSlotList(tx, T, { name: "Ana", config: cfg }, ana);
      const lb = await saveSlotList(tx, T, { name: "Bia", config: cfg }, bia);
      if (la.status !== "ok" || lb.status !== "ok") throw new Error("setup de listas falhou");
      listAna = la.id;
      listBia = lb.id;
    });
  });
  afterAll(async () => {
    await admin`delete from tenants where id = ${T}`;
    for (const id of Object.values(users)) await admin`delete from "user" where id = ${id}`;
    await admin.end();
  });

  const actorOf = async (userId: string): Promise<Actor> => {
    const { membershipOf } = await import("@/features/team/membership");
    const m = await membershipOf(userId);
    if (!m) throw new Error("sem vínculo");
    return m;
  };

  it("membershipOf devolve salão, papel e profissional do login", async () => {
    const { membershipOf } = await import("@/features/team/membership");
    expect(await membershipOf(users.dona)).toEqual({ tenantId: T, role: "owner", professionalId: ana });
    expect(await membershipOf(users.gerente)).toEqual({ tenantId: T, role: "admin", professionalId: null });
    expect(await membershipOf(users.ana)).toEqual({ tenantId: T, role: "professional", professionalId: ana });
    expect(await membershipOf("ninguem")).toBeNull();
  });

  it("profissional edita o atendimento dela, não o de outra", async () => {
    const { withTenant } = await import("@/db/client");
    const { mayEditAppointments } = await import("@/features/team/guard");
    const eu = await actorOf(users.ana);
    await withTenant(T, async (tx) => {
      expect(await mayEditAppointments(tx, eu, [apptAna])).toBe(true);
      expect(await mayEditAppointments(tx, eu, [apptBia])).toBe(false);
      // lote com um de outra: nega o lote todo
      expect(await mayEditAppointments(tx, eu, [apptAna, apptBia])).toBe(false);
    });
  });

  it("dona e gerente editam o atendimento de qualquer profissional", async () => {
    const { withTenant } = await import("@/db/client");
    const { mayEditAppointments } = await import("@/features/team/guard");
    for (const u of [users.dona, users.gerente]) {
      const eu = await actorOf(u);
      await withTenant(T, async (tx) => {
        expect(await mayEditAppointments(tx, eu, [apptAna, apptBia])).toBe(true);
      });
    }
  });

  it("profissional sem vínculo a uma profissional não edita atendimento nenhum", async () => {
    const { withTenant } = await import("@/db/client");
    const { mayEditAppointments } = await import("@/features/team/guard");
    const eu = await actorOf(users.solta);
    await withTenant(T, async (tx) => {
      expect(await mayEditAppointments(tx, eu, [apptAna])).toBe(false);
    });
  });

  it("bloqueio: profissional mexe no dela, não no do salão todo; dona mexe em todos", async () => {
    const { withTenant } = await import("@/db/client");
    const { mayEditBlock } = await import("@/features/team/guard");
    const eu = await actorOf(users.ana);
    const dona = await actorOf(users.dona);
    await withTenant(T, async (tx) => {
      expect(await mayEditBlock(tx, eu, blockAna)).toBe(true);
      expect(await mayEditBlock(tx, eu, blockSalao)).toBe(false);
      expect(await mayEditBlock(tx, dona, blockSalao)).toBe(true);
      expect(await mayEditBlock(tx, dona, blockAna)).toBe(true);
    });
  });

  it("lista de vagas: só da própria profissional", async () => {
    const { withTenant } = await import("@/db/client");
    const { mayEditSlotList } = await import("@/features/team/guard");
    const eu = await actorOf(users.ana);
    await withTenant(T, async (tx) => {
      expect(await mayEditSlotList(tx, eu, listAna)).toBe(true);
      expect(await mayEditSlotList(tx, eu, listBia)).toBe(false);
    });
  });

  it("id que não existe passa pela guarda (o core responde sem acesso)", async () => {
    const { withTenant } = await import("@/db/client");
    const { mayEditAppointments } = await import("@/features/team/guard");
    const eu = await actorOf(users.ana);
    await withTenant(T, async (tx) => {
      expect(await mayEditAppointments(tx, eu, ["00000000-0000-4000-8000-000000000000"])).toBe(true);
    });
  });

  it("profissional não vê financeiro do salão nem plano; dona e gerente veem (plano só a dona)", async () => {
    const eu = await actorOf(users.ana);
    expect(canAs(eu, "finance.salon")).toBe(false);
    expect(canAs(eu, "billing.manage")).toBe(false);
    expect(canAs(eu, "salon.settings")).toBe(false);
    const gerente = await actorOf(users.gerente);
    expect(canAs(gerente, "finance.salon")).toBe(true);
    expect(canAs(gerente, "billing.manage")).toBe(false);
    const dona = await actorOf(users.dona);
    expect(canAs(dona, "finance.salon")).toBe(true);
    expect(canAs(dona, "billing.manage")).toBe(true);
  });
});
