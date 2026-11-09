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
    expect(sent).toEqual(["+5511987655555|Ainda não recebi sua confirmação, Bia 😊 Responda 1 para confirmar"]);
    expect(
      (await admin`select status, nudge_sent_at from appointments where id = ${a}`)[0].nudge_sent_at,
    ).not.toBeNull();
    await runReminders(portFor, new Date(now.getTime() + 5 * 60_000));
    expect(sent).toHaveLength(1); // nunca repete
    expect((await admin`select status from appointments where id = ${a}`)[0].status).toBe("pending_confirmation");
  });

  it("não manda para quem já confirmou, está longe, ou com lembrete recente; nem de madrugada", async () => {
    sent.length = 0;
    await admin`truncate appointments cascade`;
    await add("2026-11-10T16:30:00Z", "2026-11-09T18:00:00Z", "confirmed");
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
});
