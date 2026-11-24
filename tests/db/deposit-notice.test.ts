// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("sinal recebido no WhatsApp (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, S: string, C: string;
  const now = new Date();
  const at = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();
  const sent: string[] = [];
  const port = { sendText: async (_: string, t: string) => (sent.push(t), { id: `dp${sent.length}` }) };
  const later = new Date(now.getTime() + 60_000);

  beforeAll(async () => {
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] =
      await admin`insert into tenants (name, whatsapp_instance, pix_key) values ('Estúdio D', 'studio-d', 'pix@d.com') returning id`;
    [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia','+5511977770002') returning id`;
  });
  afterAll(async () => admin.end());

  const appt = async (h: number) =>
    (
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,deposit_requested_cents)
      values (${T},${C},${S},${at(h)},${at(h + 1)},10000,'pending_confirmation',3000) returning id`
    )[0].id as string;
  const lib = async () => ({
    ...(await import("@/db/client")),
    ...(await import("@/features/appointments/core")),
    ...(await import("@/features/messaging/deposit-send")),
  });
  const pay = async (id: string, cents: number | null, notify: boolean) => {
    const { withTenant, setPayment, depositPending, afterPaymentChange } = await lib();
    await withTenant(T, async (tx) => {
      const was = await depositPending(tx, id);
      await setPayment(tx, id, cents === null ? null : { method: "pix", amountCents: cents });
      await afterPaymentChange(tx, id, was, notify, now);
    });
  };
  const status = async (id: string) => (await admin`select status from appointments where id = ${id}`)[0].status;

  it("sinal recebido avisando: depois do Desfazer confirma o horário e manda uma vez", async () => {
    const { withTenant, sendDueDepositNotices } = await lib();
    const id = await appt(30);
    sent.length = 0;
    await pay(id, 3000, true);
    // Ainda no Desfazer: nada sai e continua pendente
    expect(await withTenant(T, (tx) => sendDueDepositNotices(tx, T, port, now))).toEqual({ sent: 0, failed: 0 });
    expect(await status(id)).toBe("pending_confirmation");
    expect(await withTenant(T, (tx) => sendDueDepositNotices(tx, T, port, later))).toEqual({ sent: 1, failed: 0 });
    expect(await withTenant(T, (tx) => sendDueDepositNotices(tx, T, port, later))).toEqual({ sent: 0, failed: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatch(/^Recebi seu sinal de R\$\s30,00 💜\nSeu horário de Gel .+ está confirmado\./);
    expect(await status(id)).toBe("confirmed");
  });

  it("aviso desligado confirma na hora, sem mensagem", async () => {
    const { withTenant, sendDueDepositNotices } = await lib();
    const id = await appt(40);
    sent.length = 0;
    await pay(id, 3000, false);
    expect(await status(id)).toBe("confirmed");
    expect(await withTenant(T, (tx) => sendDueDepositNotices(tx, T, port, later))).toEqual({ sent: 0, failed: 0 });
    expect(sent).toHaveLength(0);
  });

  it("Desfazer, sinal parcial ou horário que já passou: nada sai", async () => {
    const { withTenant, sendDueDepositNotices } = await lib();
    sent.length = 0;
    const undone = await appt(50);
    await pay(undone, 3000, true);
    await pay(undone, null, false);
    const partial = await appt(60);
    await pay(partial, 1000, true);
    const past = await appt(-2);
    await pay(past, 3000, true);
    expect(await withTenant(T, (tx) => sendDueDepositNotices(tx, T, port, later))).toEqual({ sent: 0, failed: 0 });
    expect(sent).toHaveLength(0);
    expect(await status(undone)).toBe("pending_confirmation");
    expect(await status(partial)).toBe("pending_confirmation");
  });
});
