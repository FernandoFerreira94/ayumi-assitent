// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("link do calendário (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string;
  let feed: typeof import("@/features/calendar-feed/server");

  beforeAll(async () => {
    feed = await import("@/features/calendar-feed/server");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] =
      await admin`insert into tenants (name, calendar_token_hash) values ('Studio A', 'hash-a') returning id`;
    [{ id: B }] =
      await admin`insert into tenants (name, calendar_token_hash) values ('Studio B', 'hash-b') returning id`;
    for (const [t, client] of [
      [A, "Ana Souza"],
      [B, "Bia Lima"],
    ] as const) {
      const [{ id: c }] =
        await admin`insert into clients (tenant_id,name,phone_e164) values (${t},${client},${"+55119" + (t === A ? "1" : "2").repeat(8)}) returning id`;
      const [{ id: s }] =
        await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${t},'Corte',60,5000) returning id`;
      const day = new Date(Date.now() + 2 * 86_400_000);
      day.setUTCHours(12, 0, 0, 0);
      const end = new Date(day.getTime() + 3_600_000);
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
        values (${t},${c},${s},${day},${end},5000,'confirmed')`;
      const later = new Date(day.getTime() + 86_400_000);
      await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
        values (${t},${c},${s},${later},${new Date(later.getTime() + 3_600_000)},5000,'cancelled')`;
      await admin`insert into blocks (tenant_id,starts_at,ends_at,source,reason)
        values (${t},${later},${new Date(later.getTime() + 3_600_000)},'google','Reunião do Google')`;
    }
  });
  afterAll(async () => {
    await admin.end();
  });

  it("acha o estúdio pelo hash e não acha hash desconhecido", async () => {
    expect((await feed.tenantByTokenHash("hash-a"))?.id).toBe(A);
    expect(await feed.tenantByTokenHash("nada")).toBeNull();
  });

  it("só o estúdio do link, sem cancelados nem eventos do Google; nome oculto quando pedido", async () => {
    const t = (await feed.tenantByTokenHash("hash-a"))!;
    const ics = await feed.feedIcs(t);
    expect(ics).toContain("SUMMARY:Ana · Corte");
    expect(ics).not.toContain("Bia");
    expect(ics).not.toContain("Reunião do Google");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    const hidden = await feed.feedIcs({ ...t, hideNames: true });
    expect(hidden).toContain("SUMMARY:Atendimento · Corte");
    expect(hidden).not.toContain("Ana");
    expect(B).toBeTruthy();
  });
});
