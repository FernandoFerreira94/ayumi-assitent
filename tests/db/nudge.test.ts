// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("reforço único de confirmação (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, C: string, S: string;
  let runReminders: typeof import("@/features/reminders/run").runReminders;
  const sent: string[] = [];
  const portFor = () => ({
    sendText: async (to: string, t: string) => {
      sent.push(`${to}|${t}`);
      return { id: `n${sent.length}` };
    },
  });
  const at = (iso: string) => new Date(iso);
  const add = async (starts: string, reminder: string | null, status = "pending_confirmation") => {
    const [r] =
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,reminder_sent_at)
      values (${T},${C},${S},${starts},${new Date(at(starts).getTime() + 3600_000).toISOString()},10000,${status}::appointment_status,${reminder}) returning id`;
    return r.id as string;
  };

  beforeAll(async () => {
    ({ runReminders } = await import("@/features/reminders/run"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] =
      await admin`insert into tenants (name, whatsapp_instance) values ('Estúdio N', 'studio-n') returning id`;
    [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Bia Souza','+5511987655555') returning id`;
  });
  afterAll(async () => admin.end());

  it("manda uma vez, ~3 h antes, para quem não respondeu", async () => {
    // Atendimento 15h BRT (18:00Z); agora 12:30 BRT (15:30Z); lembrete saiu na véspera
    const a = await add("2026-11-10T18:00:00Z", "2026-11-09T18:00:00Z");
    const now = at("2026-11-10T15:30:00Z");
    await runReminders(portFor, now);
    expect(sent).toEqual([
      "+5511987655555|Oi, Bia! Passando para lembrar do seu horário de Gel hoje às 15:00 😊 Pode me confirmar?\n\nResponda com o número:\n1 - Confirmo\n2 - Cancelar\n3 - Reagendar",
    ]);
    expect(
      (await admin`select status, nudge_sent_at from appointments where id = ${a}`)[0].nudge_sent_at,
    ).not.toBeNull();
    await runReminders(portFor, new Date(now.getTime() + 5 * 60_000));
    expect(sent).toHaveLength(1); // nunca repete
    expect((await admin`select status from appointments where id = ${a}`)[0].status).toBe("pending_confirmation");
  });

  it("quem já confirmou recebe só o lembrete, sem as opções 1/2/3", async () => {
    sent.length = 0;
    await admin`truncate appointments cascade`;
    await add("2026-11-10T16:30:00Z", "2026-11-09T18:00:00Z", "confirmed");
    await runReminders(portFor, at("2026-11-10T15:30:00Z"));
    expect(sent).toEqual([
      "+5511987655555|Oi, Bia! Passando para lembrar do seu horário de Gel hoje às 13:30 😊 Te espero com carinho! 💜",
    ]);
  });

  it("com o 1º aviso desligado: não manda o 1º e o 2º sai mesmo sem ele", async () => {
    sent.length = 0;
    await admin`truncate appointments cascade`;
    await admin`update tenants set first_reminder = false where id = ${T}`;
    // Agendado bem antes; sem 1º aviso enviado
    const [{ id: a }] =
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,created_at)
      values (${T},${C},${S},'2026-11-10T18:00:00Z','2026-11-10T19:00:00Z',10000,'pending_confirmation','2026-11-08T12:00:00Z') returning id`;
    // Véspera, 24 h antes: o 1º aviso sairia aqui, mas está desligado
    await runReminders(portFor, at("2026-11-09T18:00:00Z"));
    expect(sent).toHaveLength(0);
    await runReminders(portFor, at("2026-11-10T15:30:00Z"));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("Responda com o número:");
    expect((await admin`select reminder_sent_at from appointments where id = ${a}`)[0].reminder_sent_at).toBeNull();
    await admin`update tenants set first_reminder = true where id = ${T}`;
  });

  it("não manda para quem está longe ou com lembrete recente; nem de madrugada", async () => {
    sent.length = 0;
    await admin`truncate appointments cascade`;
    await add("2026-11-10T22:00:00Z", "2026-11-09T18:00:00Z"); // começa em 6,5 h
    await add("2026-11-10T18:00:00Z", "2026-11-10T14:00:00Z"); // lembrete há 1,5 h
    await runReminders(portFor, at("2026-11-10T15:30:00Z"));
    expect(sent).toHaveLength(0);
    await add("2026-11-10T10:30:00Z", "2026-11-09T18:00:00Z"); // 07:30 BRT, aviso cairia às 04:30
    await runReminders(portFor, at("2026-11-10T08:00:00Z"));
    expect(sent).toHaveLength(0);
  });

  it("segue as horas do 2º aviso da dona e não manda se ela desligou", async () => {
    sent.length = 0;
    await admin`truncate appointments cascade`;
    // Atendimento 15h BRT (18:00Z); agora 10:30 BRT (13:30Z) = faltam 4,5 h; lembrete saiu na véspera
    await add("2026-11-10T18:00:00Z", "2026-11-09T18:00:00Z");
    const now = at("2026-11-10T13:30:00Z");
    await admin`update tenants set second_reminder_hours = 3 where id = ${T}`;
    await runReminders(portFor, now);
    expect(sent).toHaveLength(0); // com 3 h ainda não é hora
    await admin`update tenants set second_reminder_hours = 5 where id = ${T}`;
    await runReminders(portFor, now);
    expect(sent).toHaveLength(1); // com 5 h já é
    sent.length = 0;
    await admin`truncate appointments cascade`;
    await add("2026-11-10T18:00:00Z", "2026-11-09T18:00:00Z");
    await admin`update tenants set second_reminder_hours = null where id = ${T}`;
    await runReminders(portFor, at("2026-11-10T15:30:00Z"));
    expect(sent).toHaveLength(0); // só um aviso
  });

  it("avisa a dona uma vez só quando a cliente não respondeu, e o toque abre a conversa", async () => {
    sent.length = 0;
    await admin`truncate appointments cascade`;
    await admin`insert into "user" (id,name,email) values ('nr1','Dona','nr1@t.test') on conflict do nothing`;
    await admin`insert into push_subscriptions (tenant_id, user_id, endpoint, p256dh, auth) values (${T}, 'nr1', 'https://push.example/nr1', 'k', 'a')`;
    const pushed: { title: string; url: string }[] = [];
    const push = { send: async (_s: unknown, p: { title: string; url: string }) => void pushed.push(p) };
    await admin`update tenants set second_reminder_hours = null where id = ${T}`;
    // Sem 2º aviso: 2 h depois do 1º sem resposta. Atendimento 18h BRT (21:00Z), lembrete às 11h BRT (14:00Z)
    const a = await add("2026-11-10T21:00:00Z", "2026-11-10T14:00:00Z");
    await runReminders(portFor, at("2026-11-10T15:30:00Z"), undefined, push);
    expect(pushed).toHaveLength(0); // só 1,5 h
    await runReminders(portFor, at("2026-11-10T16:05:00Z"), undefined, push);
    expect(pushed).toEqual([expect.objectContaining({ title: "Bia não respondeu", url: `/agenda?conversa=${C}` })]);
    await runReminders(portFor, at("2026-11-10T16:30:00Z"), undefined, push);
    expect(pushed).toHaveLength(1); // uma vez por agendamento
    expect((await admin`select no_reply_at from appointments where id = ${a}`)[0].no_reply_at).not.toBeNull();
    await admin`delete from push_subscriptions where tenant_id = ${T}`;
  });
});
