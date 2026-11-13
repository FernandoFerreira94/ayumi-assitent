// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

const H = 3_600_000;
const base = new Date(Date.now() + 3 * 86_400_000);
base.setUTCHours(12, 0, 0, 0);
const at = (h: number) => new Date(base.getTime() + h * H);
const from = new Date(Date.now() - 86_400_000);
const to = new Date(Date.now() + 30 * 86_400_000);

d("eventos do iPhone (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string;
  let db: typeof import("@/db/client");
  let imp: typeof import("@/features/calendar-feed/icloud-import");
  let blocksCore: typeof import("@/features/blocks/core");

  beforeAll(async () => {
    db = await import("@/db/client");
    imp = await import("@/features/calendar-feed/icloud-import");
    blocksCore = await import("@/features/blocks/core");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('Studio A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('Studio B') returning id`;
    const [{ id: c }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${A},'Maria Souza','+5511911111111') returning id`;
    const [{ id: s }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${A},'Corte',60,5000) returning id`;
    // atendimento do app às +4h e evento do Google às +6h: o mesmo horário vindo do iPhone não duplica
    await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${A},${c},${s},${at(4)},${at(5)},5000,'confirmed')`;
    await admin`insert into blocks (tenant_id,starts_at,ends_at,source,reason,google_event_id)
      values (${A},${at(6)},${at(7)},'google','Reunião','g1')`;
  });
  afterAll(async () => {
    await admin?.end();
  });

  const rows = (t: string) =>
    admin`select external_uid, reason, starts_at, converted_at from blocks where tenant_id=${t} and source='icloud' order by starts_at`;

  it("grava, não duplica atendimento/Google, atualiza e apaga o que sumiu", async () => {
    const evs = [
      { uid: "e1", title: "Maria - corte", startsAt: at(0), endsAt: at(1) },
      { uid: "e2", title: "Dentista", startsAt: at(2), endsAt: at(3) },
      { uid: "dup-appt", title: "Maria", startsAt: at(4), endsAt: at(5) },
      { uid: "dup-google", title: "Reunião", startsAt: at(6), endsAt: at(7) },
    ];
    expect(await db.withTenant(A, (tx) => imp.importIcloudEvents(tx, A, evs, from, to))).toBe(2);
    expect((await rows(A)).map((r) => r.external_uid)).toEqual(["e1", "e2"]);

    // e1 mudou de título e e2 foi apagado no iPhone
    await db.withTenant(A, (tx) =>
      imp.importIcloudEvents(tx, A, [{ ...evs[0], title: "Maria Souza - corte" }], from, to),
    );
    const after = await rows(A);
    expect(after.map((r) => [r.external_uid, r.reason])).toEqual([["e1", "Maria Souza - corte"]]);
    expect(await rows(B)).toHaveLength(0); // outro estúdio não vê nada
  });

  it("virou atendimento: some da agenda, libera o horário e a reimportação não traz de volta", async () => {
    const [{ id }] = await admin`select id from blocks where tenant_id=${A} and external_uid='e1'`;
    expect(await db.withTenant(A, (tx) => blocksCore.overlapsBlock(tx, at(0), at(1)))).toBe(true);
    // outro estúdio não consegue converter
    expect(await db.withTenant(B, (tx) => blocksCore.convertExternalBlock(tx, id))).toBe(false);
    expect(await db.withTenant(A, (tx) => blocksCore.convertExternalBlock(tx, id))).toBe(true);
    expect(await db.withTenant(A, (tx) => blocksCore.convertExternalBlock(tx, id))).toBe(false); // só uma vez
    expect(await db.withTenant(A, (tx) => blocksCore.overlapsBlock(tx, at(0), at(1)))).toBe(false);
    const listed = await db.withTenant(A, (tx) => blocksCore.listBlocks(tx, [from, to]));
    expect(listed.some((b) => b.id === id)).toBe(false);

    await db.withTenant(A, (tx) =>
      imp.importIcloudEvents(tx, A, [{ uid: "e1", title: "Maria", startsAt: at(0), endsAt: at(1) }], from, to),
    );
    await db.withTenant(A, (tx) => imp.importIcloudEvents(tx, A, [], from, to));
    const [r] = await rows(A);
    expect(r.external_uid).toBe("e1");
    expect(r.converted_at).not.toBeNull();
  });

  it("bloqueio do app não pode ser 'convertido'", async () => {
    const [{ id }] =
      await admin`insert into blocks (tenant_id,starts_at,ends_at,source) values (${A},${at(10)},${at(11)},'app') returning id`;
    expect(await db.withTenant(A, (tx) => blocksCore.convertExternalBlock(tx, id))).toBe(false);
  });

  it("desligar tira só o que veio do iPhone", async () => {
    await db.withTenant(A, (tx) => imp.clearIcloudEvents(tx));
    expect(await rows(A)).toHaveLength(0);
    const [{ n }] = await admin`select count(*)::int n from blocks where tenant_id=${A}`;
    expect(n).toBe(2); // Google + bloqueio do app
  });
});
