// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("resposta da cliente pelo WhatsApp (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, C: string, A: string;
  let handleInbound: typeof import("@/features/messaging/inbound").handleInbound;
  const now = new Date("2026-11-10T15:00:00Z");
  const sent: string[] = [];
  const pushes: string[] = [];
  const synced: string[] = [];
  const deps = {
    portFor: () => ({
      sendText: async (to: string, t: string) => {
        sent.push(`${to}|${t}`);
        return { id: `ack${sent.length}` };
      },
    }),
    push: null,
    syncAppointment: async (_t: string, a: string) => void synced.push(a),
    now,
  };
  const msg = (id: string, text: string, over: object = {}) => ({
    instance: "studio-r",
    externalId: id,
    fromMe: false,
    // Sem o nono dígito, como o WhatsApp às vezes manda
    phoneDigits: "551187655555",
    text,
    ...over,
  });

  beforeAll(async () => {
    ({ handleInbound } = await import("@/features/messaging/inbound"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] =
      await admin`insert into tenants (name, whatsapp_instance) values ('Estúdio R', 'studio-r') returning id`;
    const [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia Souza','+5511987655555') returning id`;
    [{ id: A }] =
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,reminder_sent_at)
      values (${T},${C},${S},'2026-11-11T13:00:00Z','2026-11-11T14:00:00Z',10000,'pending_confirmation',${now.toISOString()}) returning id`;
  });
  afterAll(async () => admin.end());

  it("número que não é cliente não grava nada", async () => {
    expect(await handleInbound(msg("x1", "oi", { phoneDigits: "5521999998888" }), deps)).toEqual({
      handled: false,
      reason: "client",
    });
    expect(await handleInbound(msg("x2", "oi", { instance: "outra" }), deps)).toEqual({
      handled: false,
      reason: "tenant",
    });
    expect((await admin`select count(*)::int as n from messages`)[0].n).toBe(0);
  });

  it("'1' com lembrete em aberto confirma, agradece e entra na conversa", async () => {
    expect(await handleInbound(msg("m1", "1"), deps)).toEqual({ handled: true, intent: "confirm", appointmentId: A });
    const [a] = await admin`select status, reply_at from appointments where id = ${A}`;
    expect(a.status).toBe("confirmed");
    expect(a.reply_at).not.toBeNull();
    expect(sent.at(-1)).toContain("+5511987655555|Obrigada, Bia! Seu horário está confirmado");
    const conv = await admin`select direction, kind, intent from messages where client_id = ${C} order by created_at`;
    expect(conv.map((m) => `${m.direction}:${m.kind}:${m.intent ?? ""}`)).toEqual([
      "in:client:confirm",
      "out:auto_reply:",
    ]);
  });

  it("webhook repetido não faz nada duas vezes", async () => {
    expect(await handleInbound(msg("m1", "1"), deps)).toEqual({ handled: false, reason: "duplicate" });
    expect(sent).toHaveLength(1);
  });

  it("depois de respondido, outra mensagem só entra na conversa (e fica não lida)", async () => {
    expect(await handleInbound(msg("m2", "2"), deps)).toEqual({ handled: true, intent: null, appointmentId: null });
    expect((await admin`select status from appointments where id = ${A}`)[0].status).toBe("confirmed");
    const unread = await admin`select count(*)::int as n from messages where direction = 'in' and read_at is null`;
    expect(unread[0].n).toBe(2);
  });

  it("eco do que o app mandou não duplica; o que a dona escreve pelo celular entra", async () => {
    expect(await handleInbound(msg("ack1", "Obrigada, Bia!", { fromMe: true }), deps)).toEqual({
      handled: false,
      reason: "duplicate",
    });
    expect(await handleInbound(msg("p1", "Te espero!", { fromMe: true }), deps)).toMatchObject({ handled: true });
    expect((await admin`select kind from messages where external_id = 'p1'`)[0].kind).toBe("phone");
  });

  it("'cancela' com lembrete em aberto cancela e leva ao Google", async () => {
    await admin`update appointments set reply_at = null, status = 'pending_confirmation' where id = ${A}`;
    expect(await handleInbound(msg("m3", "cancela por favor"), deps)).toMatchObject({ intent: "cancel" });
    expect((await admin`select status from appointments where id = ${A}`)[0].status).toBe("cancelled");
    expect(synced).toEqual([A]);
  });

  it("'3' pede para remarcar sem mexer no horário", async () => {
    await admin`update appointments set reply_at = null, status = 'confirmed' where id = ${A}`;
    expect(await handleInbound(msg("m4", "3"), deps)).toMatchObject({ intent: "reschedule" });
    expect((await admin`select status from appointments where id = ${A}`)[0].status).toBe("reschedule_requested");
  });
});
