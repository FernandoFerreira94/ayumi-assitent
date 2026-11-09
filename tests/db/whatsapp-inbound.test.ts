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
  const deps = {
    portFor: () => ({
      sendText: async (to: string, t: string) => {
        sent.push(`${to}|${t}`);
        return { id: `ack${sent.length}` };
      },
    }),
    push: null,
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

  const reopen = (status = "pending_confirmation") =>
    admin`update appointments set reply_at = null, status = ${status}::appointment_status where id = ${A}`;
  const apptRow = async () => (await admin`select status from appointments where id = ${A}`)[0];

  it("pedido de cancelar não cancela: vira 'quer remarcar' e a cliente só recebe que a profissional vai verificar", async () => {
    await reopen();
    sent.length = 0;
    expect(await handleInbound(msg("m3", "cancela por favor"), deps)).toMatchObject({
      handled: true,
      intent: "cancel",
      appointmentId: A,
    });
    expect((await apptRow()).status).toBe("reschedule_requested");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("verificar com a profissional o melhor horário");
  });

  it("'3' pede para remarcar sem mexer no horário e recebe a mesma resposta", async () => {
    await reopen("confirmed");
    sent.length = 0;
    expect(await handleInbound(msg("m4", "3"), deps)).toMatchObject({ intent: "reschedule" });
    expect((await apptRow()).status).toBe("reschedule_requested");
    expect(sent[0]).toContain("verificar com a profissional");
  });

  it("texto livre não recebe resposta automática nenhuma", async () => {
    sent.length = 0;
    expect(await handleInbound(msg("f1", "Oi! Vocês fazem unha de fibra?"), deps)).toMatchObject({
      handled: true,
      intent: null,
    });
    expect(sent).toHaveLength(0);
  });

  describe("com a IA ligada (modelo simulado)", () => {
    const handoff = "Vou passar para a profissional e ela continua a conversa com você 💜";
    let verdict: { intent: string; confidence: number } | null;
    const ai = {
      ...deps,
      now: new Date(),
      classify: async () => verdict as never,
    };
    const fresh = async () => {
      await admin`delete from messages where kind in ('auto_reply','phone')`;
      // Horário sempre no futuro, já que aqui o "agora" é o relógio real
      await admin`update appointments set reply_at = null, ai_handoff_at = null, status = 'pending_confirmation',
        starts_at = now() + interval '1 day', ends_at = now() + interval '1 day 1 hour' where id = ${A}`;
      sent.length = 0;
    };
    const handoffAt = async () => (await admin`select ai_handoff_at from appointments where id = ${A}`)[0].ai_handoff_at;
    let n = 0;
    const m = (text: string, over: object = {}) => msg(`ai${++n}`, text, over);

    it("desligada, a mensagem que as regras não entendem não recebe resposta", async () => {
      await fresh();
      verdict = { intent: "confirm", confidence: 1 };
      await handleInbound(m("pode contar comigo, até amanhã"), ai);
      expect(sent).toHaveLength(0);
      expect((await apptRow()).status).toBe("pending_confirmation");
    });

    it("com certeza alta confirma sozinha e agradece", async () => {
      await admin`update tenants set ai_enabled = true where id = ${T}`;
      await fresh();
      verdict = { intent: "confirm", confidence: 0.95 };
      expect(await handleInbound(m("pode contar comigo, até amanhã"), ai)).toMatchObject({ intent: "confirm" });
      expect((await apptRow()).status).toBe("confirmed");
      expect(sent[0]).toContain("Seu horário está confirmado");
    });

    it("correção até 2h depois aplica a nova intenção (cancelar vira 'quer remarcar')", async () => {
      sent.length = 0;
      expect(await handleInbound(m("ops, errei, preciso remarcar"), ai)).toMatchObject({ intent: "reschedule" });
      expect((await apptRow()).status).toBe("reschedule_requested");
    });

    it("baixa confiança ou outro assunto: avisa que a profissional continua, uma vez por agendamento", async () => {
      await fresh();
      verdict = { intent: "other", confidence: 0.99 };
      await handleInbound(m("vocês trabalham no sábado? e quanto custa o gel?"), ai);
      expect(sent).toEqual([`+5511987655555|${handoff}`]);
      expect(await handoffAt()).not.toBeNull();
      expect((await apptRow()).status).toBe("pending_confirmation");
      await handleInbound(m("e aí?"), ai);
      expect(sent).toHaveLength(1);
    });

    it("sem resposta do modelo (erro ou sem chave) também passa para a profissional", async () => {
      await fresh();
      verdict = null;
      await handleInbound(m("vou me atrasar uns minutinhos"), ai);
      expect(sent).toEqual([`+5511987655555|${handoff}`]);
    });

    it("áudio ou foto passa direto, sem perguntar ao modelo", async () => {
      await fresh();
      verdict = { intent: "confirm", confidence: 1 };
      await handleInbound(m("[áudio]", { media: true }), ai);
      expect(sent[0]).toContain("Recebi! Vou passar para a profissional");
      expect((await apptRow()).status).toBe("pending_confirmation");
    });

    it("fica quieta se a dona escreveu pelo celular nas últimas 12h", async () => {
      await fresh();
      await handleInbound(m("Oi Bia, tudo bem?", { fromMe: true }), ai);
      verdict = { intent: "confirm", confidence: 1 };
      await handleInbound(m("pode contar comigo, até amanhã"), ai);
      expect(sent).toHaveLength(0);
      expect((await apptRow()).status).toBe("pending_confirmation");
    });

    it("no máximo 3 respostas automáticas por cliente em 24h", async () => {
      await fresh();
      for (let i = 0; i < 3; i++)
        await admin`insert into messages (tenant_id, client_id, direction, kind, body) values (${T}, ${C}, 'out', 'auto_reply', 'x')`;
      verdict = { intent: "other", confidence: 1 };
      await handleInbound(m("vocês trabalham no sábado?"), ai);
      expect(sent).toHaveLength(0);
    });
  });
});
