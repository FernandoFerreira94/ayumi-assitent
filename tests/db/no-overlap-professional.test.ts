// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

const MIGRATIONS = new URL("../../src/db/migrations/", import.meta.url);
const NOVA = "0037_professional_schedule.sql";

/** Aplica as migrations em ordem, como scripts/migrate.mjs, mas só as que passam no filtro. */
async function aplicar(sql: ReturnType<typeof postgres>, filtro: (f: string) => boolean) {
  const arquivos = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql") && filtro(f))
    .sort();
  for (const f of arquivos) await sql.unsafe(readFileSync(new URL(f, MIGRATIONS), "utf8"));
}

/** Cria um banco descartável (nome termina em _test, na mesma instância local) e devolve as conexões. */
async function bancoDescartavel(nome: string) {
  const u = new URL(url!);
  const admin = postgres(url!, { max: 1 });
  await admin.unsafe(`drop database if exists ${nome}`);
  await admin.unsafe(`create database ${nome}`);
  u.pathname = `/${nome}`;
  const db = postgres(u.toString(), { max: 1, onnotice: () => {} });
  return {
    db,
    async fechar() {
      await db.end();
      await admin.unsafe(`drop database if exists ${nome}`);
      await admin.end();
    },
  };
}

const horario = (h: number, m = 0) => new Date(Date.UTC(2030, 0, 10, h, m)).toISOString();

d("migration 0037: sobreposição por profissional (Postgres real)", () => {
  let banco: Awaited<ReturnType<typeof bancoDescartavel>>;
  let db: ReturnType<typeof postgres>;
  let T: string, cli: string, svc: string, ana: string, bia: string;

  beforeAll(async () => {
    banco = await bancoDescartavel("assist_mig0037_overlap_test");
    db = banco.db;
    await aplicar(db, () => true);
    [{ id: T }] = await db`insert into tenants (name) values ('Salão Duplo') returning id`;
    [{ id: svc }] = await db`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Corte',60,8000) returning id`;
    [{ id: cli }] = await db`insert into clients (tenant_id,name,phone_e164) values (${T},'Cli','+5511900000001') returning id`;
    [{ id: ana }] = await db`insert into professionals (tenant_id, display_name, position) values (${T},'Ana',0) returning id`;
    [{ id: bia }] = await db`insert into professionals (tenant_id, display_name, position) values (${T},'Bia',1) returning id`;
  });
  afterAll(async () => banco?.fechar());

  const marcar = (prof: string | null, ini: string, fim: string, status = "confirmed") =>
    db`insert into appointments (tenant_id,professional_id,client_id,service_id,starts_at,ends_at,price_cents,status)
       values (${T},${prof},${cli},${svc},${ini},${fim},8000,${status}) returning id`;

  it("duas profissionais do mesmo salão no mesmo horário: aceito", async () => {
    await marcar(ana, horario(12), horario(13));
    await marcar(bia, horario(12), horario(13));
    const rows = await db`select professional_id from appointments where starts_at = ${horario(12)}`;
    expect(rows).toHaveLength(2);
  });

  it("a mesma profissional em horário sobreposto: recusado (colado e cancelado passam)", async () => {
    await marcar(ana, horario(15), horario(16));
    await expect(marcar(ana, horario(15, 30), horario(16, 30))).rejects.toMatchObject({ code: "23P01" });
    await marcar(ana, horario(16), horario(17)); // colado
    await marcar(ana, horario(15, 30), horario(16, 30), "cancelled"); // cancelado não ocupa
  });

  it("o intervalo depois do atendimento (blocked_until) também vale por profissional", async () => {
    await db`update appointments set buffer_min = 30 where professional_id = ${ana} and starts_at = ${horario(16)}`;
    await expect(marcar(ana, horario(17), horario(18))).rejects.toMatchObject({ code: "23P01" });
    await marcar(bia, horario(17), horario(18)); // outra profissional não é afetada
  });

  it("sem professional_id no insert, entra a primeira profissional do salão", async () => {
    const [{ id }] = await marcar(null, horario(9), horario(10));
    const [row] = await db`select professional_id from appointments where id = ${id}`;
    expect(row.professional_id).toBe(ana);
  });

  it("salão sem nenhuma profissional ganha uma ao agendar (não quebra cadastro novo)", async () => {
    const [{ id: T2 }] = await db`insert into tenants (name) values ('Salão Novo') returning id`;
    const [{ id: s2 }] = await db`insert into services (tenant_id,name,duration_min,price_cents) values (${T2},'Corte',60,8000) returning id`;
    const [{ id: c2 }] = await db`insert into clients (tenant_id,name,phone_e164) values (${T2},'Cli','+5511900000002') returning id`;
    const [{ id }] = await db`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents)
      values (${T2},${c2},${s2},${horario(9)},${horario(10)},8000) returning id`;
    const [row] = await db`select p.display_name, p.tenant_id from appointments a join professionals p on p.id = a.professional_id where a.id = ${id}`;
    expect(row).toMatchObject({ display_name: "Salão Novo", tenant_id: T2 });
  });
});

d("migration 0037: backfill dos dados existentes (Postgres real)", () => {
  let banco: Awaited<ReturnType<typeof bancoDescartavel>>;
  let db: ReturnType<typeof postgres>;
  let A: string, B: string, semProf: string, profA: string;

  beforeAll(async () => {
    banco = await bancoDescartavel("assist_mig0037_backfill_test");
    db = banco.db;
    // Salões A e B existem antes da 0036 (ela cria a profissional deles); o terceiro nasce depois.
    const PROFISSIONAIS = "0036_professionals.sql";
    await aplicar(db, (f) => f < PROFISSIONAIS);
    [{ id: A }] = await db`insert into tenants (name, owner_name) values ('Salão A','Ana Dona') returning id`;
    [{ id: B }] = await db`insert into tenants (name, owner_name) values ('Salão B','Bia Dona') returning id`;
    await aplicar(db, (f) => f === PROFISSIONAIS);
    // salão criado depois da 0036: o cadastro ainda não cria profissional
    [{ id: semProf }] = await db`insert into tenants (name) values ('Salão sem profissional') returning id`;
    const prof = await db`select id, tenant_id from professionals`;
    profA = prof.find((p) => p.tenant_id === A)!.id;
    for (const [t, tag] of [[A, "a"], [B, "b"], [semProf, "c"]] as const) {
      const [{ id: svc }] = await db`insert into services (tenant_id,name,duration_min,price_cents) values (${t},'Corte',60,8000) returning id`;
      const [{ id: cli }] = await db`insert into clients (tenant_id,name,phone_e164) values (${t},'Cli',${"+551190000000" + (tag === "a" ? 1 : tag === "b" ? 2 : 3)}) returning id`;
      await db`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents)
        values (${t},${cli},${svc},${horario(12)},${horario(13)},8000)`;
      await db`insert into blocks (tenant_id,starts_at,ends_at,reason) values (${t},${horario(15)},${horario(16)},'Almoço')`;
      await db`insert into working_hours (tenant_id,weekday,opens,closes) values (${t},1,'09:00','18:00'),(${t},2,'10:00','16:00')`;
      await db`insert into slot_lists (tenant_id,name,config) values (${t},'Manhãs','{}')`;
    }
    await aplicar(db, (f) => f === NOVA);
  });
  afterAll(async () => banco?.fechar());

  it("atendimentos, expediente e listas ficam com a profissional do salão", async () => {
    for (const t of [A, B, semProf]) {
      const [p] = await db`select id from professionals where tenant_id = ${t} order by created_at limit 1`;
      for (const tabela of ["appointments", "working_hours", "slot_lists"]) {
        const rows = await db.unsafe(`select distinct professional_id from ${tabela} where tenant_id = $1`, [t]);
        expect(rows.map((r) => r.professional_id)).toEqual([p.id]);
      }
    }
    const [p] = await db`select id from professionals where tenant_id = ${A}`;
    expect(p.id).toBe(profA);
  });

  it("salão sem profissional ganha uma, com o nome do salão", async () => {
    const rows = await db`select display_name from professionals where tenant_id = ${semProf}`;
    expect(rows).toEqual([{ display_name: "Salão sem profissional" }]);
  });

  it("bloqueios existentes ficam sem profissional (valem para o salão todo)", async () => {
    const rows = await db`select professional_id from blocks`;
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.professional_id === null)).toBe(true);
  });

  it("expediente: a chave agora é (profissional, dia); duas profissionais têm horários próprios", async () => {
    const [outra] = await db`insert into professionals (tenant_id, display_name, position) values (${A},'Nova',1) returning id`;
    await db`insert into working_hours (tenant_id,professional_id,weekday,opens,closes) values (${A},${outra.id},1,'12:00','20:00')`;
    await expect(
      db`insert into working_hours (tenant_id,professional_id,weekday,opens,closes) values (${A},${outra.id},1,'08:00','09:00')`,
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("lista de vagas: o nome é único por profissional, não por salão", async () => {
    const [outra] = await db`select id from professionals where tenant_id = ${A} and id <> ${profA}`;
    await db`insert into slot_lists (tenant_id,professional_id,name,config) values (${A},${outra.id},'Manhãs','{}')`;
    await expect(
      db`insert into slot_lists (tenant_id,professional_id,name,config) values (${A},${profA},'Manhãs','{}')`,
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("atendimento exige profissional (sem ela e sem salão para inferir, o banco recusa)", async () => {
    const [{ is_nullable }] = await db`select is_nullable from information_schema.columns
      where table_name = 'appointments' and column_name = 'professional_id'`;
    expect(is_nullable).toBe("NO");
  });
});

d("migration 0037: trigger e função sob RLS como app_user (Postgres real)", () => {
  let banco: Awaited<ReturnType<typeof bancoDescartavel>>;
  let db: ReturnType<typeof postgres>;
  let T: string, Outro: string;

  beforeAll(async () => {
    banco = await bancoDescartavel("assist_mig0037_rls_test");
    db = banco.db;
    await aplicar(db, () => true);
    [{ id: T }] = await db`insert into tenants (name, owner_name) values ('Salão RLS','Rita') returning id`;
    [{ id: Outro }] = await db`insert into tenants (name) values ('Outro Salão') returning id`;
  });
  afterAll(async () => banco?.fechar());

  /** Executa como o app: salão ativo na sessão e papel app_user (igual a withTenant). */
  const comoApp = <R>(tenant: string, fn: (tx: postgres.TransactionSql) => Promise<R>) =>
    db.begin(async (tx) => {
      await tx`select set_config('app.tenant_id', ${tenant}, true)`;
      await tx`set local role app_user`;
      return fn(tx);
    }) as Promise<R>;

  it("expediente sem professional_id: a trigger cria a profissional (nome da dona) mesmo como app_user", async () => {
    const [row] = await comoApp(T, async (tx) => {
      await tx`insert into working_hours (tenant_id,weekday,opens,closes) values (${T},1,'09:00','18:00')`;
      return tx`select p.display_name from working_hours w join professionals p on p.id = w.professional_id`;
    });
    expect(row.display_name).toBe("Rita");
  });

  it("default_professional_id devolve sempre a mesma e recusa outro salão", async () => {
    const [a, b] = await comoApp(T, async (tx) => [
      (await tx`select default_professional_id(${T}::uuid) as id`)[0].id,
      (await tx`select default_professional_id(${T}::uuid) as id`)[0].id,
    ]);
    expect(a).toBe(b);
    await expect(comoApp(T, (tx) => tx`select default_professional_id(${Outro}::uuid)`)).rejects.toThrow(/salão diferente/);
    expect(await db`select 1 from professionals where tenant_id = ${Outro}`).toHaveLength(0);
  });
});
