// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const sent = vi.hoisted(() => [] as string[]);
const seq = vi.hoisted(() => ({ n: 0 }));
vi.mock("@/features/messaging/evolution", () => ({
  messagingForInstance: () => ({
    sendText: async (_to: string, text: string) => {
      sent.push(text);
      return { id: `bk${++seq.n}` };
    },
  }),
}));
// Fora do silêncio da noite, para o lembrete poder sair no teste
vi.mock("@/features/reminders/quiet", () => ({ isQuietHour: () => false, QUIET_FROM_HOUR: 21, QUIET_UNTIL_HOUR: 6, nextSendable: (t: Date) => t }));

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("confirmação do agendamento x 1º aviso (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, S: string, C: string;
  const now = new Date();
  const at = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

  beforeAll(async () => {
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] =
      await admin`insert into tenants (name, whatsapp_instance) values ('Estúdio B', 'studio-b') returning id`;
    [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia','+5511987655555') returning id`;
  });
  afterAll(async () => admin.end());

  const appt = async (h: number) =>
    (
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${C},${S},${at(h)},${at(h + 1)},10000,'pending_confirmation') returning id`
    )[0].id as string;

  it("agendou dentro da janela do 1º aviso: a confirmação pede 1/2/3, vale como 1º aviso e o lembrete não sai em seguida", async () => {
    const { sendBookingMessage } = await import("@/features/messaging/booking-send");
    const { sendReminders } = await import("@/features/reminders/core");
    const { withTenant } = await import("@/db/client");
    const id = await appt(2);
    sent.length = 0;
    expect(await sendBookingMessage(T, id, now)).toBe("sent");
    expect(sent[0]).toContain("Responda com o número:");
    const [row] = await admin`select reminder_sent_at from appointments where id = ${id}`;
    expect(row.reminder_sent_at).not.toBeNull();
    expect((await admin`select kind from messages where appointment_id = ${id}`)[0].kind).toBe("reminder");
    const port = { sendText: async (_: string, t: string) => (sent.push(t), { id: "r1" }) };
    expect(await withTenant(T, (tx) => sendReminders(tx, port, new Date(now.getTime() + 5 * 60_000)))).toMatchObject({
      sent: 0,
    });
    expect(sent).toHaveLength(1);
  });

  it("agendou para daqui a dias: confirmação sem opções; o 1º aviso sai no tempo dele", async () => {
    const { sendBookingMessage } = await import("@/features/messaging/booking-send");
    const id = await appt(72);
    sent.length = 0;
    expect(await sendBookingMessage(T, id, now)).toBe("sent");
    expect(sent[0]).not.toContain("Responda com o número:");
    expect((await admin`select reminder_sent_at from appointments where id = ${id}`)[0].reminder_sent_at).toBeNull();
    expect((await admin`select kind from messages where appointment_id = ${id}`)[0].kind).toBe("auto_reply");
  });

  it("horário que já passou (atendimento lançado depois) não manda mensagem", async () => {
    const { sendBookingMessage } = await import("@/features/messaging/booking-send");
    const id = await appt(-3);
    sent.length = 0;
    expect(await sendBookingMessage(T, id, now)).toBe("skipped");
    expect(sent).toHaveLength(0);
  });

  it("1º aviso de quem já confirmou só lembra, sem 1/2/3", async () => {
    const { sendReminders } = await import("@/features/reminders/core");
    const { withTenant } = await import("@/db/client");
    const id = await appt(20);
    await admin`update appointments set status = 'confirmed' where id = ${id}`;
    const texts: string[] = [];
    const port = { sendText: async (_: string, t: string) => (texts.push(t), { id: "c1" }) };
    expect(await withTenant(T, (tx) => sendReminders(tx, port, now))).toMatchObject({ sent: 1 });
    expect(texts[0]).toContain("Te espero com carinho");
    expect(texts[0]).not.toContain("Responda com o número:");
    await admin`update appointments set status = 'cancelled' where id = ${id}`;
  });

  it("cancelar, faltar ou concluir apaga a resposta guardada da noite (não sai às 6h com data velha)", async () => {
    const { setStatus } = await import("@/features/appointments/core");
    const { withTenant } = await import("@/db/client");
    const id = await appt(30);
    await admin`update appointments set pending_reply = 'Oba, confirmado' where id = ${id}`;
    expect(await withTenant(T, (tx) => setStatus(tx, id, "cancelled", now))).toMatchObject({ ok: true });
    expect((await admin`select pending_reply from appointments where id = ${id}`)[0].pending_reply).toBeNull();
  });
  it("1º aviso só até 2 h antes: em cima da hora (ex.: WhatsApp reconectado) não pede 1/2/3", async () => {
    const { claimDue } = await import("@/features/reminders/core");
    const { withTenant } = await import("@/db/client");
    await admin`delete from appointments where tenant_id = ${T}`;
    const near = await appt(1.5);
    const ok = await appt(3);
    const ids = (await withTenant(T, (tx) => claimDue(tx, now))).map((r) => r.id);
    expect(ids).toContain(ok);
    expect(ids).not.toContain(near);
    expect((await admin`select reminder_sent_at from appointments where id = ${near}`)[0].reminder_sent_at).toBeNull();
  });
});
