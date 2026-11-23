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
    [{ id: cli }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana','+5511977770000') returning id`;
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

  it("muda o horário; o estado das mensagens só zera quando o aviso sai (depois do Desfazer)", async () => {
    const { sendRescheduleNotice } = await import("@/features/messaging/reschedule-send");
    const id = await insert("2030-01-10T12:00:00Z", "2030-01-10T13:00:00Z");
    await admin`update appointments set reply_at = now(), nudge_sent_at = now(), no_reply_at = now(),
      cancel_asked_at = now(), ai_handoff_at = now(), pending_reply = 'Oba, confirmado' where id = ${id}`;
    expect(await move(id, "2030-01-10T14:15:00Z", "2030-01-10T15:30:00Z")).toEqual({ ok: true, data: { moved: true } });
    const [row] = await admin`select starts_at, ends_at, reminder_sent_at, status from appointments where id = ${id}`;
    expect(new Date(row.starts_at).toISOString()).toBe("2030-01-10T14:15:00.000Z");
    expect(new Date(row.ends_at).toISOString()).toBe("2030-01-10T15:30:00.000Z");
    // Ainda no Desfazer: nada mudou nas mensagens
    expect(row.reminder_sent_at).not.toBeNull();
    expect(row.status).toBe("confirmed");
    // Passou o Desfazer: o aviso (mesmo sem WhatsApp) zera tudo que era do horário antigo
    await withTenant(T, (tx) => sendRescheduleNotice(tx, T, id, null, new Date(Date.now() + 60_000)));
    const [after] = await admin`select status, reminder_sent_at, reply_at, nudge_sent_at, no_reply_at, cancel_asked_at,
      ai_handoff_at, pending_reply from appointments where id = ${id}`;
    expect(after).toEqual({
      status: "pending_confirmation",
      reminder_sent_at: null,
      reply_at: null,
      nudge_sent_at: null,
      no_reply_at: null,
      cancel_asked_at: null,
      ai_handoff_at: null,
      pending_reply: null,
    });
  });

  it("arrastar e desfazer antes do aviso não mexe em nada; só mudar a duração também não", async () => {
    const { sendRescheduleNotice } = await import("@/features/messaging/reschedule-send");
    const id = await insert("2030-01-13T12:00:00Z", "2030-01-13T13:00:00Z");
    await move(id, "2030-01-13T15:00:00Z", "2030-01-13T16:00:00Z");
    await move(id, "2030-01-13T12:00:00Z", "2030-01-13T13:00:00Z");
    expect(await withTenant(T, (tx) => sendRescheduleNotice(tx, T, id, null, new Date(Date.now() + 60_000)))).toBe(
      "unchanged",
    );
    await move(id, "2030-01-13T12:00:00Z", "2030-01-13T13:30:00Z");
    const [row] = await admin`select status, reminder_sent_at from appointments where id = ${id}`;
    expect(row.status).toBe("confirmed");
    expect(row.reminder_sent_at).not.toBeNull();
  });

  it("recusa em cima de outro atendimento ou de um bloqueio e não mexe no original", async () => {
    const a = await insert("2030-01-11T12:00:00Z", "2030-01-11T13:00:00Z");
    await insert("2030-01-11T14:00:00Z", "2030-01-11T15:00:00Z");
    await admin`insert into blocks (tenant_id,starts_at,ends_at,reason) values (${T},'2030-01-11T16:00:00Z','2030-01-11T17:00:00Z','Almoço')`;
    expect(await move(a, "2030-01-11T14:30:00Z", "2030-01-11T15:30:00Z")).toMatchObject({
      ok: false,
      code: "SLOT_TAKEN",
    });
    expect(await move(a, "2030-01-11T16:30:00Z", "2030-01-11T17:30:00Z")).toMatchObject({
      ok: false,
      code: "SLOT_TAKEN",
    });
    const [row] = await admin`select starts_at from appointments where id = ${a}`;
    expect(new Date(row.starts_at).toISOString()).toBe("2030-01-11T12:00:00.000Z");
  });

  it("atendimento cancelado não pode ser arrastado", async () => {
    const id = await insert("2030-01-12T12:00:00Z", "2030-01-12T13:00:00Z");
    await admin`update appointments set status = 'cancelled' where id = ${id}`;
    expect(await move(id, "2030-01-12T14:00:00Z", "2030-01-12T15:00:00Z")).toMatchObject({
      ok: false,
      code: "NOT_ALLOWED",
    });
  });
});
