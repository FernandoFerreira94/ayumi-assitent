// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

const MIGRATIONS = new URL("../../src/db/migrations/", import.meta.url);
const NOVA = "0036_professionals.sql";

/** Aplica as migrations em ordem, como scripts/migrate.mjs, mas só as que passam no filtro. */
async function aplicar(sql: ReturnType<typeof postgres>, filtro: (f: string) => boolean) {
  const arquivos = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql") && filtro(f))
    .sort();
  for (const f of arquivos) await sql.unsafe(readFileSync(new URL(f, MIGRATIONS), "utf8"));
}

/**
 * Banco descartável (nome termina em _test, na mesma instância local): sobe até a 0035, grava dados do
 * jeito que o app antigo gravava, aplica a 0036 e confere o que a migração fez com eles.
 */
d("migration 0036: profissionais e papéis (Postgres real)", () => {
  const nome = "assist_mig0036_test";
  let admin: ReturnType<typeof postgres>;
  let mig: ReturnType<typeof postgres>;
  const T = { yumi: "", semNome: "", semDona: "", dupla: "" };

  beforeAll(async () => {
    const u = new URL(url!);
    admin = postgres(url!, { max: 1 });
    await admin.unsafe(`drop database if exists ${nome}`);
    await admin.unsafe(`create database ${nome}`);
    u.pathname = `/${nome}`;
    mig = postgres(u.toString(), { max: 1, onnotice: () => {} });

    await aplicar(mig, (f) => f < NOVA);

    const user = async (id: string, name: string, criado: string) =>
      mig`insert into "user" (id, name, email, "createdAt") values (${id}, ${name}, ${id + "@x.com"}, ${criado})`;
    await user("u-yumi", "Yumi Usuária", "2026-01-01T00:00:00Z");
    await user("u-sem-nome", "Bia Silva", "2026-01-02T00:00:00Z");
    await user("u-sem-dona", "Equipe Staff", "2026-01-03T00:00:00Z");
    await user("u-dupla", "Duda Dupla", "2026-01-04T00:00:00Z");

    const tenant = async (name: string, owner: string | null) => {
      const [{ id }] = await mig`insert into tenants (name, owner_name) values (${name}, ${owner}) returning id`;
      return id as string;
    };
    T.yumi = await tenant("Studio Yumi", "Yumi Tanaka");
    T.semNome = await tenant("Studio Bia", "   ");
    T.semDona = await tenant("Studio sem dona", null);
    T.dupla = await tenant("Studio da Duda", null);
    const segundo = await tenant("Segundo salão da Duda", null);

    await mig`update tenants set calendar_token_hash = 'hash-yumi', calendar_hide_names = true,
      icloud_calendar_url = 'webcal://icloud.example/yumi' where id = ${T.yumi}`;
    await mig`insert into memberships (user_id, tenant_id, role) values
      ('u-yumi', ${T.yumi}, 'owner'),
      ('u-sem-nome', ${T.semNome}, 'owner'),
      ('u-sem-dona', ${T.semDona}, 'staff'),
      ('u-dupla', ${T.dupla}, 'owner'),
      ('u-dupla', ${segundo}, 'staff')`;

    await aplicar(mig, (f) => f === NOVA);
  });

  afterAll(async () => {
    await mig?.end();
    await admin?.unsafe(`drop database if exists ${nome}`);
    await admin?.end();
  });

  it("cada salão ganha 1 profissional com o nome da dona e os campos de calendário copiados", async () => {
    const [p] = await mig`select * from professionals where tenant_id = ${T.yumi}`;
    expect(p).toMatchObject({
      display_name: "Yumi Tanaka",
      active: true,
      position: 0,
      calendar_token_hash: "hash-yumi",
      calendar_hide_names: true,
      icloud_calendar_url: "webcal://icloud.example/yumi",
    });
    expect(await mig`select id from professionals`).toHaveLength(5);
    // tenants mantém os campos (copia, não move)
    const [t] = await mig`select calendar_token_hash from tenants where id = ${T.yumi}`;
    expect(t.calendar_token_hash).toBe("hash-yumi");
  });

  it("sem owner_name usa o nome do usuário; sem dona usa o nome do salão", async () => {
    const [a] = await mig`select display_name from professionals where tenant_id = ${T.semNome}`;
    expect(a.display_name).toBe("Bia Silva");
    const [b] = await mig`select display_name from professionals where tenant_id = ${T.semDona}`;
    expect(b.display_name).toBe("Studio sem dona");
  });

  it("liga o vínculo da dona à profissional; os demais ficam sem profissional", async () => {
    const [m] = await mig`select m.professional_id, p.tenant_id from memberships m
      join professionals p on p.id = m.professional_id where m.user_id = 'u-yumi'`;
    expect(m.tenant_id).toBe(T.yumi);
    const [staff] = await mig`select professional_id from memberships where user_id = 'u-sem-dona'`;
    expect(staff.professional_id).toBeNull();
  });

  it("staff virou professional e o check só aceita owner, admin e professional", async () => {
    const [m] = await mig`select role from memberships where user_id = 'u-sem-dona'`;
    expect(m.role).toBe("professional");
    expect(await mig`select 1 from memberships where role = 'staff'`).toHaveLength(0);
    await mig`insert into "user" (id, name, email) values ('u-admin', 'Adm', 'adm@x.com')`;
    await expect(
      mig`insert into memberships (user_id, tenant_id, role) values ('u-admin', ${T.yumi}, 'staff')`,
    ).rejects.toMatchObject({ constraint_name: "memberships_role_check" });
    await mig`insert into memberships (user_id, tenant_id, role) values ('u-admin', ${T.yumi}, 'admin')`;
  });

  it("quem tinha dois vínculos fica com o de dono; o salão não é apagado", async () => {
    const rows = await mig`select tenant_id, role from memberships where user_id = 'u-dupla'`;
    expect(rows).toEqual([{ tenant_id: T.dupla, role: "owner" }]);
    expect(await mig`select id from tenants where name = 'Segundo salão da Duda'`).toHaveLength(1);
  });

  it("uma pessoa, um salão: o índice único barra um segundo vínculo", async () => {
    await expect(
      mig`insert into memberships (user_id, tenant_id, role) values ('u-yumi', ${T.semNome}, 'admin')`,
    ).rejects.toMatchObject({ code: "23505" });
  });
});

d("professionals: isolamento por salão (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let A: string, B: string;
  let withTenant: typeof import("@/db/client").withTenant;
  let schema: typeof import("@/db/schema");

  beforeAll(async () => {
    ({ withTenant } = await import("@/db/client"));
    schema = await import("@/db/schema");
    admin = postgres(url!, { max: 1 });
    await admin`truncate tenants cascade`;
    [{ id: A }] = await admin`insert into tenants (name) values ('Salão A') returning id`;
    [{ id: B }] = await admin`insert into tenants (name) values ('Salão B') returning id`;
    await admin`insert into professionals (tenant_id, display_name) values (${A}, 'Ana'), (${B}, 'Bia')`;
  });
  afterAll(async () => admin.end());

  it("cada salão só enxerga as próprias profissionais", async () => {
    const asA = await withTenant(A, (tx) => tx.select().from(schema.professionals));
    expect(asA.map((p) => p.displayName)).toEqual(["Ana"]);
  });

  it("não deixa gravar profissional em nome de outro salão", async () => {
    await expect(
      withTenant(A, (tx) => tx.insert(schema.professionals).values({ tenantId: B, displayName: "Intrusa" })),
    ).rejects.toThrow();
  });
});
