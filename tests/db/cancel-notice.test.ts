// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("aviso de cancelamento no WhatsApp (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, S: string, C: string;
  const now = new Date();
  const at = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();
  const sent: string[] = [];
  const port = { sendText: async (_: string, t: string) => (sent.push(t), { id: `cx${sent.length}` }) };
  const later = new Date(now.getTime() + 60_000);

  beforeAll(async () => {
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] =
      await admin`insert into tenants (name, whatsapp_instance) values ('Estúdio X', 'studio-x') returning id`;
    [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana Lima','+5511977770001') returning id`;
  });
  afterAll(async () => admin.end());

  const appt = async (h: number) =>
    (
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${C},${S},${at(h)},${at(h + 1)},8000,'confirmed') returning id`
    )[0].id as string;
  const lib = async () => ({
    ...(await import("@/db/client")),
    ...(await import("@/features/appointments/core")),
    ...(await import("@/features/messaging/cancel-send")),
  });

  it("cancelar avisando: sai depois do Desfazer, uma vez, e fica na conversa", async () => {
    const { withTenant, setStatus, sendDueCancelNotices } = await lib();
    const id = await appt(30);
    sent.length = 0;
    await withTenant(T, (tx) => setStatus(tx, id, "cancelled", now, null, true));
    // Ainda no Desfazer: nada sai
    expect(await withTenant(T, (tx) => sendDueCancelNotices(tx, T, port, now))).toEqual({ sent: 0, failed: 0 });
    expect(await withTenant(T, (tx) => sendDueCancelNotices(tx, T, port, later))).toEqual({ sent: 1, failed: 0 });
    expect(await withTenant(T, (tx) => sendDueCancelNotices(tx, T, port, later))).toEqual({ sent: 0, failed: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatch(/^Oi! Seu horário de Corte \(.+, às \d{2}:\d{2}\) foi cancelado\./);
    expect((await admin`select kind from messages where appointment_id = ${id}`)[0].kind).toBe("auto_reply");
  });

  it("Desfazer, aviso desligado ou horário que já passou: nada sai", async () => {
    const { withTenant, setStatus, sendDueCancelNotices } = await lib();
    sent.length = 0;
    const undone = await appt(40);
    await withTenant(T, (tx) => setStatus(tx, undone, "cancelled", now, null, true));
    await withTenant(T, (tx) => setStatus(tx, undone, "confirmed", now));
    const off = await appt(50);
    await withTenant(T, (tx) => setStatus(tx, off, "cancelled", now, null, false));
    const past = await appt(-2);
    await withTenant(T, (tx) => setStatus(tx, past, "cancelled", now, null, true));
    expect(await withTenant(T, (tx) => sendDueCancelNotices(tx, T, port, later))).toEqual({ sent: 0, failed: 0 });
    expect(sent).toHaveLength(0);
    expect(
      await admin`select id from appointments where cancel_notice_at is not null and id in (${undone}, ${off}, ${past})`,
    ).toHaveLength(0);
  });

  it("cliente que pediu SAIR não recebe", async () => {
    const { withTenant, setStatus, sendDueCancelNotices } = await lib();
    sent.length = 0;
    const id = await appt(60);
    await admin`update clients set opted_out_at = now() where id = ${C}`;
    await withTenant(T, (tx) => setStatus(tx, id, "cancelled", now, null, true));
    await withTenant(T, (tx) => sendDueCancelNotices(tx, T, port, later));
    expect(sent).toHaveLength(0);
    await admin`update clients set opted_out_at = null where id = ${C}`;
  });
});
