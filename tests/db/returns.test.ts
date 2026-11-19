// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("data do retorno ao concluir (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let T: string, unha: string, escova: string, corte: string, cli: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let setStatus: typeof import("@/features/appointments/core").setStatus;

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    ({ setStatus } = await import("@/features/appointments/core"));
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: T }] = await admin`insert into tenants (name) values ('Estúdio Retorno') returning id`;
    const svc = async (name: string, days: number | null) =>
      (
        await admin`insert into services (tenant_id,name,duration_min,price_cents,return_days)
          values (${T},${name},60,5000,${days}) returning id`
      )[0].id as string;
    unha = await svc("Unha", 15);
    escova = await svc("Escova", 30);
    corte = await svc("Corte", null);
    [{ id: cli }] =
      await admin`insert into clients (tenant_id,name,phone_e164) values (${T},'Ana','+5511977771111') returning id`;
  });
  afterAll(async () => admin.end());

  // Todos em 10/03 em São Paulo, cada um num horário (a agenda não aceita sobreposição)
  let hour = 11;
  const insert = async (service: string, extra: string[] = [], start = `2030-03-10T${hour++}:00:00Z`) => {
    const [{ id }] = await admin`
      insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${T},${cli},${service},${start},${start}::timestamptz + interval '1 hour',5000,'confirmed') returning id`;
    for (const [i, s] of [service, ...extra].entries())
      await admin`insert into appointment_services (appointment_id,tenant_id,service_id,position,price_cents,duration_min)
        values (${id},${T},${s},${i},5000,60)`;
    return id as string;
  };
  // "Agora" depois de todos os horários do teste (Faltou só vale depois do início)
  const later = new Date("2031-01-01T00:00:00Z");
  const status = (id: string, s: "done" | "confirmed" | "no_show", now = later) =>
    withTenant(T, (tx) => setStatus(tx, id, s, now));
  const row = async (id: string) =>
    (
      await admin`select to_char(return_due_on,'YYYY-MM-DD') as due, return_skipped_at from appointments where id = ${id}`
    )[0];

  it("concluir grava o retorno contado do dia no fuso do estúdio", async () => {
    // 23:30 em São Paulo = 02:30 UTC do dia 11: conta do dia 10
    const id = await insert(unha, [], "2030-03-11T02:30:00Z");
    expect(await status(id, "done")).toMatchObject({ ok: true });
    expect((await row(id)).due).toBe("2030-03-25");
  });

  it("vários serviços: vale o menor retorno", async () => {
    const id = await insert(escova, [unha, corte]);
    await status(id, "done");
    expect((await row(id)).due).toBe("2030-03-25");
  });

  it("serviço sem retorno não grava data", async () => {
    const id = await insert(corte);
    await status(id, "done");
    expect((await row(id)).due).toBeNull();
  });

  it("desfazer ou mudar para falta limpa a data e o Não precisa", async () => {
    const id = await insert(unha);
    await status(id, "done");
    await admin`update appointments set return_skipped_at = now() where id = ${id}`;
    await status(id, "confirmed");
    expect(await row(id)).toMatchObject({ due: null, return_skipped_at: null });
    await status(id, "done");
    await status(id, "no_show");
    expect((await row(id)).due).toBeNull();
  });

  it("Faltou antes do horário de início é recusado e não muda nada", async () => {
    const id = await insert(unha, [], "2030-03-10T23:00:00Z"); // 20:00 em São Paulo
    expect(await status(id, "no_show", new Date("2030-03-10T22:59:00Z"))).toMatchObject({
      ok: false,
      code: "NO_SHOW_TOO_EARLY",
    });
    expect((await admin`select status from appointments where id = ${id}`)[0].status).toBe("confirmed");
    expect(await status(id, "no_show", new Date("2030-03-10T23:00:00Z"))).toMatchObject({ ok: true });
  });
});
