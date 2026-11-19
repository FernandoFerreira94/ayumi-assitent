// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("pagamento do agendamento (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, T2: string, svc: string, cli: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let core: typeof import("@/features/appointments/core");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    core = await import("@/features/appointments/core");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio Pago') returning id`;
    [{ id: T2 }] = await admin`insert into tenants (name) values ('Outro') returning id`;
    [{ id: svc }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Unha',60,5000) returning id`;
    [{ id: cli }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana','+5511977772222') returning id`;
  });
  afterAll(async () => admin.end());

  const row = async (id: string) =>
    (await admin`select paid_at, payment_method, status from appointments where id = ${id}`)[0];

  let hour = 10;
  const book = (payment?: { method: "pix" | null } | null) =>
    withTenant(T, (tx) =>
      core.insertAppointment(tx, T, { clientId: cli, serviceIds: [svc], date: "2030-04-10", time: `${hour++}:00`, payment }),
    );

  it("agendar já pago grava quando e a forma", async () => {
    const r = await book({ method: "pix" });
    if (!r.ok) throw new Error(r.code);
    const a = await row(r.data.id);
    expect(a.paid_at).toBeInstanceOf(Date);
    expect(a.payment_method).toBe("pix");
  });

  it("agendar sem pagamento fica a pagar; marcar e desmarcar depois não mexe no status", async () => {
    const r = await book(null);
    if (!r.ok) throw new Error(r.code);
    expect((await row(r.data.id)).paid_at).toBeNull();
    expect(await withTenant(T, (tx) => core.setPayment(tx, r.data.id, { method: null }))).toMatchObject({ ok: true });
    expect(await row(r.data.id)).toMatchObject({ payment_method: null, status: "pending_confirmation" });
    expect((await row(r.data.id)).paid_at).toBeInstanceOf(Date);
    await withTenant(T, (tx) => core.setPayment(tx, r.data.id, null));
    expect(await row(r.data.id)).toMatchObject({ paid_at: null, payment_method: null });
  });

  it("cancelado não aceita marcação nova", async () => {
    const r = await book(null);
    if (!r.ok) throw new Error(r.code);
    await admin`update appointments set status = 'cancelled' where id = ${r.data.id}`;
    expect(await withTenant(T, (tx) => core.setPayment(tx, r.data.id, { method: "pix" }))).toMatchObject({ ok: false });
  });

  it("outro estúdio não consegue marcar (RLS)", async () => {
    const r = await book(null);
    if (!r.ok) throw new Error(r.code);
    expect(await withTenant(T2, (tx) => core.setPayment(tx, r.data.id, { method: "pix" }))).toMatchObject({ ok: false });
    expect((await row(r.data.id)).paid_at).toBeNull();
  });

  it("forma sem pagamento é barrada pelo banco", async () => {
    const r = await book(null);
    if (!r.ok) throw new Error(r.code);
    await expect(admin`update appointments set payment_method = 'pix' where id = ${r.data.id}`).rejects.toThrow();
  });
});
