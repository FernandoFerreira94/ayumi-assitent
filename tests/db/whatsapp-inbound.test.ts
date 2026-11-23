// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Horário de silêncio (21h–6h) controlado pelo teste: parte daqui usa o relógio real
const quiet = vi.hoisted(() => ({ on: false }));
vi.mock("@/features/reminders/quiet", () => ({
  isQuietHour: () => quiet.on,
  QUIET_FROM_HOUR: 21,
  QUIET_UNTIL_HOUR: 6,
}));

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("resposta da cliente pelo WhatsApp (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, C: string, A: string;
  let handleInbound: typeof import("@/features/messaging/inbound").handleInbound;
  const now = new Date("2026-11-10T15:00:00Z");
  const sent: string[] = [];
  let ackSeq = 0;
  const deps = {
    portFor: () => ({
      sendText: async (to: string, t: string) => {
        sent.push(`${to}|${t}`);
        // Id único em todo o arquivo (o sent é zerado entre testes; o id da Evolution nunca se repete)
        return { id: `ack${++ackSeq}` };
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
    expect(sent.at(-1)).toContain("+5511987655555|Oba, Bia! Seu horário de amanhã às 10:00 está confirmado");
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

  it("depois de 2h do fechamento, outra mensagem só entra na conversa (e fica não lida)", async () => {
    // Relativo ao `now` injetado (não ao relógio do banco), senão o teste quebra quando o dia real passa de 15h UTC
    await admin`update appointments set reply_at = ${new Date(now.getTime() - 3 * 3600_000).toISOString()} where id = ${A}`;
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

  it("texto livre pedindo cancelar não muda nada nem responde: só o '2' vale", async () => {
    await reopen();
    await admin`update appointments set ai_handoff_at = null where id = ${A}`;
    sent.length = 0;
    expect(await handleInbound(msg("m3", "cancela por favor"), deps)).toMatchObject({
      handled: true,
      intent: null,
      appointmentId: null,
    });
    expect((await apptRow()).status).toBe("pending_confirmation");
    expect(sent).toHaveLength(0);
    expect(await handleInbound(msg("m3b", "2"), deps)).toMatchObject({ intent: "cancel", appointmentId: A });
    expect((await apptRow()).status).toBe("reschedule_requested");
    expect(sent[0]).toContain("Recebi seu pedido para cancelar o horário de amanhã às 10:00");
    await admin`update appointments set ai_handoff_at = null where id = ${A}`;
  });

  it("silêncio por padrão: lista, texto longo ou número muito depois do lembrete não têm resposta nem mudam nada", async () => {
    await reopen();
    sent.length = 0;
    const lista = "Contas dezembro\n\nCartão dia 1\n124,95 12/12\n455,81 3/3\n100 gasolina\n\n902,31";
    for (const [id, text] of [
      ["s1", lista],
      ["s2", "ok ".repeat(80)],
    ])
      expect(await handleInbound(msg(id, text), deps), text.slice(0, 20)).toEqual({
        handled: true,
        intent: null,
        appointmentId: null,
      });
    // 13 h depois do lembrete: a pergunta já não está aberta
    expect(await handleInbound(msg("s3", "1"), { ...deps, now: new Date(now.getTime() + 13 * 3_600_000) })).toEqual({
      handled: true,
      intent: null,
      appointmentId: null,
    });
    expect(sent).toHaveLength(0);
    expect((await apptRow()).status).toBe("pending_confirmation");
  });

  it("'3' pede para remarcar sem mexer no horário e recebe a mesma resposta", async () => {
    await reopen("confirmed");
    sent.length = 0;
    expect(await handleInbound(msg("m4", "3"), deps)).toMatchObject({ intent: "reschedule" });
    expect((await apptRow()).status).toBe("reschedule_requested");
    expect(sent[0]).toContain("Recebi seu pedido para remarcar o horário de amanhã às 10:00");
  });

  it("a dona escreveu depois do lembrete: '2' ou 'sim' respondem a ela, não mexem no horário", async () => {
    await reopen();
    sent.length = 0;
    const later = new Date(now.getTime() + 10 * 60_000).toISOString();
    await admin`insert into messages (tenant_id, client_id, direction, kind, body, created_at)
      values (${T}, ${C}, 'out', 'phone', 'Quantas unhas vamos fazer?', ${later})`;
    for (const [id, text] of [
      ["d1", "2"],
      ["d2", "sim"],
      ["d3", "não posso falar agora"],
    ])
      expect(await handleInbound(msg(id, text), deps), text).toEqual({
        handled: true,
        intent: null,
        appointmentId: null,
      });
    expect((await apptRow()).status).toBe("pending_confirmation");
    expect(sent).toHaveLength(0);
    // Entra na conversa como mensagem normal
    const rows = await admin`select intent from messages where external_id in ('d1','d2','d3')`;
    expect(rows.map((r) => r.intent)).toEqual([null, null, null]);
  });

  it("2º lembrete depois da conversa com a dona reabre a resposta por número", async () => {
    await reopen();
    sent.length = 0;
    const nudge = new Date(now.getTime() + 20 * 60_000).toISOString();
    await admin`update appointments set nudge_sent_at = ${nudge} where id = ${A}`;
    expect(await handleInbound(msg("d4", "1"), { ...deps, now: new Date(now.getTime() + 25 * 60_000) })).toMatchObject({
      intent: "confirm",
    });
    await admin`update appointments set nudge_sent_at = null where id = ${A}`;
    await admin`delete from messages where external_id like 'd%' or kind = 'phone' and body = 'Quantas unhas vamos fazer?'`;
  });

  it("eco do próprio lembrete gravado como 'phone' logo após o envio não atrapalha", async () => {
    await reopen();
    sent.length = 0;
    const echo = new Date(now.getTime() + 5_000).toISOString();
    await admin`insert into messages (tenant_id, client_id, direction, kind, body, created_at)
      values (${T}, ${C}, 'out', 'phone', 'Oi Bia! Lembrete do seu horário', ${echo})`;
    expect(await handleInbound(msg("d5", "1"), deps)).toMatchObject({ intent: "confirm", appointmentId: A });
    await admin`delete from messages where external_id = 'd5' or body = 'Oi Bia! Lembrete do seu horário'`;
  });

  it("de 21h às 6h confirma na hora, mas a resposta à cliente fica guardada e sai às 6h", async () => {
    const { sendPendingReplies } = await import("@/features/messaging/pending");
    const { withTenant } = await import("@/db/client");
    await reopen();
    sent.length = 0;
    quiet.on = true;
    try {
      expect(await handleInbound(msg("n1", "1"), deps)).toMatchObject({ intent: "confirm" });
      expect((await apptRow()).status).toBe("confirmed");
      expect(sent).toHaveLength(0);
      const port = deps.portFor();
      expect(await withTenant(T, (tx) => sendPendingReplies(tx, port, now))).toMatchObject({ sent: 0 });
    } finally {
      quiet.on = false;
    }
    // Guarda só o pedido; o texto sai montado às 6h do dia do horário ("hoje", não "amanhã")
    expect((await admin`select pending_reply from appointments where id = ${A}`)[0].pending_reply).toBe("@confirm");
    const six = new Date("2026-11-11T09:00:00Z");
    expect(await withTenant(T, (tx) => sendPendingReplies(tx, deps.portFor(), six))).toMatchObject({ sent: 1 });
    const body = "Oba, Bia! Seu horário de hoje às 10:00 está confirmado 💜 Te espero com carinho!";
    expect(sent).toEqual([`+5511987655555|${body}`]);
    expect((await admin`select pending_reply from appointments where id = ${A}`)[0].pending_reply).toBeNull();
    expect(
      (
        await admin`select count(*)::int as n from messages where kind = 'auto_reply' and body = ${body} and external_id = ${"ack" + ackSeq}`
      )[0].n,
    ).toBe(1);
  });

  it("resposta guardada não sai se o horário mudou de estado até as 6h", async () => {
    const { sendPendingReplies } = await import("@/features/messaging/pending");
    const { withTenant } = await import("@/db/client");
    await reopen();
    sent.length = 0;
    quiet.on = true;
    try {
      expect(await handleInbound(msg("n2", "1"), deps)).toMatchObject({ intent: "confirm" });
    } finally {
      quiet.on = false;
    }
    // A dona mudou o estado de madrugada (ex.: a cliente pediu para remarcar por outro caminho)
    await admin`update appointments set status = 'reschedule_requested' where id = ${A}`;
    expect(await withTenant(T, (tx) => sendPendingReplies(tx, deps.portFor(), now))).toMatchObject({ sent: 0 });
    expect(sent).toHaveLength(0);
    expect((await admin`select pending_reply from appointments where id = ${A}`)[0].pending_reply).toBeNull();
  });

  it("texto livre não recebe resposta automática nenhuma", async () => {
    sent.length = 0;
    expect(await handleInbound(msg("f1", "Oi! Vocês fazem unha de fibra?"), deps)).toMatchObject({
      handled: true,
      intent: null,
    });
    expect(sent).toHaveLength(0);
  });

  describe("resposta citando uma mensagem e mais de um horário em aberto", () => {
    let A2: string;
    const reset = async () => {
      sent.length = 0;
      await admin`delete from messages where external_id like 'q%' or external_id like 'out-%'`;
      await admin`update appointments set reply_at = null, ai_handoff_at = null, status = 'pending_confirmation',
        reminder_sent_at = ${now.toISOString()} where id = ${A}`;
    };
    const out = (id: string, kind: string, appt: string | null) =>
      admin`insert into messages (tenant_id, client_id, appointment_id, direction, kind, body, external_id, created_at)
        values (${T}, ${C}, ${appt}, 'out', ${kind}, 'x', ${id}, ${now.toISOString()})`;

    beforeAll(async () => {
      const [{ id: S }] = await admin`select id from services where tenant_id = ${T} limit 1`;
      [{ id: A2 }] =
        await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,reminder_sent_at)
        values (${T},${C},${S},'2026-11-12T14:00:00Z','2026-11-12T15:00:00Z',10000,'pending_confirmation',${now.toISOString()}) returning id`;
    });
    afterAll(async () => {
      await admin`delete from appointments where id = ${A2}`;
      await admin`delete from messages where external_id like 'q%' or external_id like 'out-%'`;
    });

    it("citando a confirmação do agendamento ('esse link não dá'), é conversa com a dona: nada muda, nada sai", async () => {
      await reset();
      await out("out-booking", "auto_reply", A);
      for (const [id, text] of [
        ["q1", "Esse link nao da"],
        ["q2", "2"],
        ["q3", "1"],
      ])
        expect(await handleInbound(msg(id, text, { quotedId: "out-booking" }), deps), text).toEqual({
          handled: true,
          intent: null,
          appointmentId: null,
        });
      expect(sent).toHaveLength(0);
      const rows = await admin`select status from appointments where id in (${A}, ${A2})`;
      expect(rows.map((r) => r.status)).toEqual(["pending_confirmation", "pending_confirmation"]);
    });

    it("dois lembretes em aberto sem citação: não escolhe nenhum, a dona decide", async () => {
      await reset();
      expect(await handleInbound(msg("q4", "1"), deps)).toEqual({ handled: true, intent: null, appointmentId: null });
      expect(sent).toHaveLength(0);
      expect((await apptRow()).status).toBe("pending_confirmation");
    });

    it("citando o lembrete de um dos horários, a resposta vale para aquele horário", async () => {
      await reset();
      await out("out-rem2", "reminder", A2);
      expect(await handleInbound(msg("q5", "1", { quotedId: "out-rem2" }), deps)).toEqual({
        handled: true,
        intent: "confirm",
        appointmentId: A2,
      });
      expect((await admin`select status from appointments where id = ${A2}`)[0].status).toBe("confirmed");
      expect((await apptRow()).status).toBe("pending_confirmation");
    });

    it("citando um lembrete antigo de horário que foi remarcado depois, não aplica nada", async () => {
      await reset();
      await out("out-old", "reminder", A);
      // Remarcado: o lembrete novo (ou nenhum) é mais recente que o citado
      await admin`update appointments set reminder_sent_at = ${new Date(now.getTime() + 60_000).toISOString()} where id = ${A}`;
      expect(await handleInbound(msg("q6", "1", { quotedId: "out-old" }), deps)).toMatchObject({ intent: null });
      expect((await apptRow()).status).toBe("pending_confirmation");
    });
  });

  describe("com a IA ligada (modelo simulado)", () => {
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
        reminder_sent_at = now(), starts_at = now() + interval '1 day', ends_at = now() + interval '1 day 1 hour' where id = ${A}`;
      sent.length = 0;
    };
    const handoffAt = async () =>
      (await admin`select ai_handoff_at from appointments where id = ${A}`)[0].ai_handoff_at;
    let n = 0;
    const m = (text: string, over: object = {}) => msg(`ai${++n}`, text, over);

    it("desligada, a mensagem que as regras não entendem não recebe resposta", async () => {
      // Ligada por padrão desde a 0022; o interruptor saiu de Ajustes, mas a coluna ainda é respeitada
      await admin`update tenants set ai_enabled = false where id = ${T}`;
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
      expect(sent[0]).toMatch(/Seu horário de amanhã às \d{2}:\d{2} está confirmado/);
    });

    it("depois de respondido, texto livre é conversa (caso real: lista de contas 1 h depois); só o número corrige", async () => {
      sent.length = 0;
      verdict = { intent: "other", confidence: 1 };
      expect(await handleInbound(m("ops, errei, preciso remarcar"), ai)).toMatchObject({ intent: null });
      expect(await handleInbound(m("Contas dezembro\n\n100 gasolina\n61 akai\n160,55"), ai)).toMatchObject({
        intent: null,
      });
      expect(sent).toHaveLength(0);
      expect((await apptRow()).status).toBe("confirmed");
      expect(await handleInbound(m("3"), ai)).toMatchObject({ intent: "reschedule" });
      expect((await apptRow()).status).toBe("reschedule_requested");
    });

    it("IA com certeza de 'cancelar' não muda nada e não responde; a dona é avisada", async () => {
      await fresh();
      verdict = { intent: "cancel", confidence: 0.99 };
      expect(await handleInbound(m("acho melhor deixar pra outra semana viu"), ai)).toMatchObject({ intent: null });
      expect((await apptRow()).status).toBe("pending_confirmation");
      expect(sent).toHaveLength(0);
      expect(await handoffAt()).not.toBeNull();
    });

    it("guarda só a possível resposta não entendida (sem telefone), para o dono rotular", async () => {
      await admin`delete from unclear_replies`;
      await fresh();
      verdict = { intent: "cancel", confidence: 0.99 };
      await handleInbound(m("acho melhor deixar pra outra semana viu"), ai);
      await fresh();
      verdict = { intent: "other", confidence: 0.9 };
      await handleInbound(m("vocês trabalham no sábado?"), ai);
      // Não guarda: lista longa, áudio, confirmação aplicada
      await fresh();
      await handleInbound(m("Contas dezembro\n\nCartão dia 1\n124,95\n455,81\n100 gasolina"), ai);
      await handleInbound(m("[áudio]", { media: true }), ai);
      await fresh();
      verdict = { intent: "confirm", confidence: 0.95 };
      await handleInbound(m("pode contar comigo, até amanhã"), ai);
      const rows = await admin`select client_id, appointment_id, question, body, ai_intent, decision, label
        from unclear_replies order by created_at`;
      expect(rows).toEqual([
        {
          client_id: C,
          appointment_id: A,
          question: "reminder",
          body: "acho melhor deixar pra outra semana viu",
          ai_intent: "cancel",
          decision: "guess",
          label: null,
        },
        {
          client_id: C,
          appointment_id: A,
          question: "reminder",
          body: "vocês trabalham no sábado?",
          ai_intent: "other",
          decision: "alerted",
          label: null,
        },
      ]);
      // A dona na conversa: não guarda
      await admin`delete from unclear_replies`;
      await fresh();
      await handleInbound(m("Oi Bia, tudo bem?", { fromMe: true }), ai);
      verdict = { intent: "other", confidence: 1 };
      await handleInbound(m("tudo sim e vc?"), ai);
      expect(await admin`select 1 from unclear_replies`).toHaveLength(0);
    });

    it("outro assunto, erro do modelo ou áudio logo após o lembrete: nenhuma resposta; a dona é avisada uma vez", async () => {
      for (const [text, v, over] of [
        ["vocês trabalham no sábado?", { intent: "other", confidence: 0.99 }, {}],
        ["vou me atrasar uns minutinhos", null, {}],
        ["[áudio]", { intent: "confirm", confidence: 1 }, { media: true }],
      ] as const) {
        await fresh();
        verdict = v as never;
        await handleInbound(m(text, over), ai);
        expect(sent, text).toHaveLength(0);
        expect(await handoffAt(), text).not.toBeNull();
        expect((await apptRow()).status).toBe("pending_confirmation");
      }
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
