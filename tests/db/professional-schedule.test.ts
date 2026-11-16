// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("agenda por profissional (núcleo, Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, svc: string, cli: string, ana: string, bia: string;
  const date = "2030-03-12";

  beforeAll(async () => {
    admin = postgres(url!, { max: 1 });
    // Salão próprio (nome único por execução): não depende de limpar as outras tabelas.
    [{ id: T }] = await admin`insert into tenants (name) values (${"Salão Duplo " + Date.now()}) returning id`;
    [{ id: svc }] = await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    [{ id: cli }] = await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Cli',${"+5511" + String(Date.now()).slice(-9)}) returning id`;
    [{ id: ana }] = await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Ana',0) returning id`;
    [{ id: bia }] = await admin`insert into professionals (tenant_id, display_name, position) values (${T},'Bia',1) returning id`;
  });
  afterAll(async () => {
    await admin`delete from tenants where id = ${T}`;
    await admin.end();
  });

  const book = async (professionalId: string, time: string) => {
    const { withTenant } = await import("@/db/client");
    const { insertAppointment } = await import("@/features/appointments/core");
    return withTenant(T, (tx) => insertAppointment(tx, T, { clientId: cli, serviceId: svc, date, time, professionalId }));
  };

  it("duas profissionais atendem no mesmo horário; a mesma não", async () => {
    expect((await book(ana, "10:00")).ok).toBe(true);
    expect((await book(bia, "10:00")).ok).toBe(true);
    expect(await book(ana, "10:30")).toMatchObject({ ok: false, code: "SLOT_TAKEN" });
  });

  it("bloqueio de uma profissional não afeta a outra; bloqueio do salão todo afeta as duas", async () => {
    const { withTenant } = await import("@/db/client");
    const { insertBlock, listBlocks } = await import("@/features/blocks/core");
    const { dayRange } = await import("@/lib/dates");

    await withTenant(T, (tx) => insertBlock(tx, T, { date, start: "14:00", end: "15:00", reason: "Médico" }, ana));
    expect(await book(ana, "14:00")).toMatchObject({ ok: false, code: "SLOT_TAKEN" });
    expect((await book(bia, "14:00")).ok).toBe(true);

    await withTenant(T, (tx) => insertBlock(tx, T, { date, start: "17:00", end: "18:00", reason: "Feriado" }));
    expect(await book(ana, "17:00")).toMatchObject({ ok: false, code: "SLOT_TAKEN" });
    expect(await book(bia, "17:00")).toMatchObject({ ok: false, code: "SLOT_TAKEN" });

    const doBia = await withTenant(T, (tx) => listBlocks(tx, dayRange(date), bia));
    expect(doBia.map((b) => b.reason)).toEqual(["Feriado"]);
    expect(await withTenant(T, (tx) => listBlocks(tx, dayRange(date)))).toHaveLength(2);
  });

  it("bloqueio do salão todo é recusado se alguma profissional tem atendimento no horário", async () => {
    const { withTenant } = await import("@/db/client");
    const { insertBlock } = await import("@/features/blocks/core");
    expect(await withTenant(T, (tx) => insertBlock(tx, T, { date, start: "10:00", end: "11:00" }))).toMatchObject({
      ok: false,
      code: "HAS_APPOINTMENTS",
    });
  });

  it("expediente é por profissional", async () => {
    const { withTenant } = await import("@/db/client");
    const { getHours, saveHours } = await import("@/features/hours/core");
    const week = [null, { opens: "08:00", closes: "12:00" }, null, null, null, null, null];
    await withTenant(T, (tx) => saveHours(tx, T, week, bia));
    expect((await withTenant(T, (tx) => getHours(tx, bia)))[1]).toMatchObject({ opens: "08:00", closes: "12:00" });
    // a Ana não tem expediente salvo: cai no padrão (seg 09:00 às 18:00)
    expect((await withTenant(T, (tx) => getHours(tx, ana)))[1]).toMatchObject({ opens: "09:00", closes: "18:00" });
  });
});
