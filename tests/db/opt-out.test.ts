// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("cliente responde SAIR / VOLTAR (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, C: string;
  let handleInbound: typeof import("@/features/messaging/inbound").handleInbound;
  let claimDue: typeof import("@/features/reminders/core").claimDue;
  let withTenant: typeof import("@/db/client").withTenant;
  const now = new Date("2026-11-10T15:00:00Z");
  const sent: string[] = [];
  const classify = vi.fn(async () => null);
  const deps = {
    portFor: () => ({
      sendText: async (_to: string, t: string) => {
        sent.push(t);
        return { id: `ack${sent.length}` };
      },
    }),
    push: null,
    classify,
    now,
  };
  const msg = (id: string, text: string) => ({
    instance: "studio-o",
    externalId: id,
    fromMe: false,
    phoneDigits: "5511987650000",
    text,
  });

  beforeAll(async () => {
    ({ handleInbound } = await import("@/features/messaging/inbound"));
    ({ claimDue } = await import("@/features/reminders/core"));
    ({ withTenant } = await import("@/db/client"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] =
      await admin`insert into tenants (name, whatsapp_instance, ai_enabled) values ('Estúdio O', 'studio-o', true) returning id`;
    const [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    [{ id: C }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana','+5511987650000') returning id`;
    await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${C},${S},'2026-11-11T13:00:00Z','2026-11-11T14:00:00Z',10000,'pending_confirmation')`;
  });
  afterAll(async () => admin.end());

  it("SAIR grava a escolha, responde uma vez, não chama a IA e tira a cliente dos lembretes", async () => {
    expect(await handleInbound(msg("o1", "SAIR"), deps)).toEqual({ handled: true, intent: null, appointmentId: null });
    expect((await admin`select opted_out_at from clients where id = ${C}`)[0].opted_out_at).not.toBeNull();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("não recebe mais lembretes");
    await handleInbound(msg("o2", "sair"), deps);
    expect(sent).toHaveLength(1);
    expect(classify).not.toHaveBeenCalled();
    expect(await withTenant(T, (tx) => claimDue(tx, now))).toHaveLength(0);
  });

  it("VOLTAR desfaz e o lembrete volta a sair", async () => {
    await handleInbound(msg("o3", "VOLTAR"), deps);
    expect((await admin`select opted_out_at from clients where id = ${C}`)[0].opted_out_at).toBeNull();
    expect(sent.at(-1)).toContain("voltaram");
    expect(await withTenant(T, (tx) => claimDue(tx, now))).toHaveLength(1);
  });
});
