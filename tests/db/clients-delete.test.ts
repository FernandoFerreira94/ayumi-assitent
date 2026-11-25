// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("excluir cliente (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, S: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let core: typeof import("@/features/clients/core");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    core = await import("@/features/clients/core");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('A') returning id`;
    [{ id: S }] =
      await admin`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
  });
  afterAll(async () => admin.end());

  it("sem atendimento, apaga de vez", async () => {
    const [{ id }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Sem Histórico','+5511900000001') returning id`;
    const r = await withTenant(T, (tx) => core.deleteClientRow(tx, id));
    expect(r.ok).toBe(true);
    expect(await admin`select id from clients where id = ${id}`).toHaveLength(0);
  });

  it("com atendimento, anonimiza, apaga a conversa e mantém o histórico", async () => {
    const [{ id }] = await admin`insert into clients (tenant_id,name,phone_e164,email,notes)
      values (${T},'Bia Souza','+5511900000002','bia@x.test','alergia') returning id`;
    await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${id},${S},'2026-10-01T12:00:00Z','2026-10-01T13:00:00Z',10000,'done')`;
    await admin`insert into messages (tenant_id,client_id,direction,kind,body) values (${T},${id},'in','client','oi')`;
    await admin`insert into unclear_replies (tenant_id,client_id,question,body,decision)
      values (${T},${id},'reminder','talvez','alerted')`;

    const r = await withTenant(T, (tx) => core.deleteClientRow(tx, id));
    expect(r.ok).toBe(true);
    const [c] = await admin`select name, phone_e164, email, notes, anonymized_at from clients where id = ${id}`;
    expect(c.name).toBe("Cliente removida");
    expect(c.phone_e164).toBe(`anon:${id}`);
    expect(c.email).toBeNull();
    expect(c.notes).toBeNull();
    expect(c.anonymized_at).not.toBeNull();
    expect(await admin`select id from messages where client_id = ${id}`).toHaveLength(0);
    expect(await admin`select id from unclear_replies where client_id = ${id}`).toHaveLength(0);
    expect(await admin`select id from appointments where client_id = ${id}`).toHaveLength(1);
    // some das listas e do seletor de agendamento
    const list = await withTenant(T, (tx) => core.searchClients(tx, ""));
    expect(list.map((x) => x.id)).not.toContain(id);
  });

  it("em lote: apaga quem não tem histórico, anonimiza quem tem e ignora outro salão", async () => {
    const [{ id: O }] = await admin`insert into tenants (name) values ('Outro') returning id`;
    const [{ id: fresh }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Nova','+5511900000011') returning id`;
    const [{ id: seen }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Antiga','+5511900000012') returning id`;
    const [{ id: other }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${O},'De outro','+5511900000013') returning id`;
    await admin`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${seen},${S},'2099-10-01T12:00:00Z','2099-10-01T13:00:00Z',10000,'confirmed')`;

    const p = await withTenant(T, (tx) => core.bulkDeletePreview(tx, [fresh, seen, other]));
    expect(p).toEqual({ found: 2, anonymize: 1, future: 1 });

    const r = await withTenant(T, (tx) => core.deleteClientRows(tx, [fresh, seen, other, fresh]));
    expect(r).toEqual({ removed: 1, anonymized: 1, failed: 1 });
    expect(await admin`select id from clients where id = ${fresh}`).toHaveLength(0);
    const [c] = await admin`select name, anonymized_at from clients where id = ${seen}`;
    expect(c.name).toBe("Cliente removida");
    expect(c.anonymized_at).not.toBeNull();
    // a cliente do outro salão não foi tocada
    const [o] = await admin`select name from clients where id = ${other}`;
    expect(o.name).toBe("De outro");
    // já anonimizada não conta de novo
    const again = await withTenant(T, (tx) => core.deleteClientRows(tx, [seen]));
    expect(again).toEqual({ removed: 0, anonymized: 0, failed: 1 });
  });
});
