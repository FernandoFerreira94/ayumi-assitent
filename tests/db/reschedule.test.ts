// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("remarcar pelo arraste (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, svc: string, cli: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let moveAppointment: typeof import("@/features/appointments/core").moveAppointment;

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    ({ moveAppointment } = await import("@/features/appointments/core"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio R') returning id`;
    [{ id: svc }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    [{ id: cli }] = await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana','+5511977770000') returning id`;
  });
  afterAll(async () => admin.end());

  const insert = async (start: string, end: string) => {
    const [{ id }] = await admin`
      insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,reminder_sent_at)
      values (${T},${cli},${svc},${start},${end},8000,'confirmed',now()) returning id`;
    return id as string;
  };
  const move = (id: string, start: string, end: string) =>
    withTenant(T, (tx) => moveAppointment(tx, T, id, new Date(start), new Date(end)));

  it("muda o horário e zera o lembrete para sair de novo", async () => {
    const id = await insert("2030-01-10T12:00:00Z", "2030-01-10T13:00:00Z");
    expect(await move(id, "2030-01-10T14:15:00Z", "2030-01-10T15:30:00Z")).toEqual({ ok: true, data: undefined });
    const [row] = await admin`select starts_at, ends_at, reminder_sent_at from appointments where id = ${id}`;
    expect(new Date(row.starts_at).toISOString()).toBe("2030-01-10T14:15:00.000Z");
    expect(new Date(row.ends_at).toISOString()).toBe("2030-01-10T15:30:00.000Z");
    expect(row.reminder_sent_at).toBeNull();
  });

  it("recusa em cima de outro atendimento ou de um bloqueio e não mexe no original", async () => {
    const a = await insert("2030-01-11T12:00:00Z", "2030-01-11T13:00:00Z");
    await insert("2030-01-11T14:00:00Z", "2030-01-11T15:00:00Z");
    await admin`insert into blocks (tenant_id,starts_at,ends_at,reason) values (${T},'2030-01-11T16:00:00Z','2030-01-11T17:00:00Z','Almoço')`;
    expect(await move(a, "2030-01-11T14:30:00Z", "2030-01-11T15:30:00Z")).toMatchObject({ ok: false, code: "SLOT_TAKEN" });
    expect(await move(a, "2030-01-11T16:30:00Z", "2030-01-11T17:30:00Z")).toMatchObject({ ok: false, code: "SLOT_TAKEN" });
    const [row] = await admin`select starts_at from appointments where id = ${a}`;
    expect(new Date(row.starts_at).toISOString()).toBe("2030-01-11T12:00:00.000Z");
  });

  it("atendimento cancelado não pode ser arrastado", async () => {
    const id = await insert("2030-01-12T12:00:00Z", "2030-01-12T13:00:00Z");
    await admin`update appointments set status = 'cancelled' where id = ${id}`;
    expect(await move(id, "2030-01-12T14:00:00Z", "2030-01-12T15:00:00Z")).toMatchObject({ ok: false, code: "NOT_ALLOWED" });
  });
});
