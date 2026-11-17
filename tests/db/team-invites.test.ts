// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

const MIGRATIONS = new URL("../../src/db/migrations/", import.meta.url);

/**
 * Banco descartável (nome termina em _test, mesma instância local): aplica todas as migrations em ordem e confere
 * a 0038 como o app a usa: papel app_user, sem salão ativo (as funções SECURITY DEFINER) e com ele (RLS).
 */
d("migration 0038: convites e funções SECURITY DEFINER (Postgres real)", () => {
  const nome = "assist_mig0038_test";
  let admin: ReturnType<typeof postgres>;
  let db: ReturnType<typeof postgres>;
  const T = { a: "", b: "", pA: "", pA2: "", pB: "" };

  /** Executa como o app, sem salão ativo (rota anônima, cadastro). */
  const asApp = async <R>(fn: (tx: postgres.TransactionSql) => Promise<R>): Promise<R> =>
    (await db.begin(async (tx) => {
      await tx`set local role app_user`;
      return fn(tx);
    })) as R;

  /** Executa como o app com salão ativo (igual a withTenant). */
  const asTenant = async <R>(tenant: string, fn: (tx: postgres.TransactionSql) => Promise<R>): Promise<R> =>
    (await db.begin(async (tx) => {
      await tx`select set_config('app.tenant_id', ${tenant}, true)`;
      await tx`set local role app_user`;
      return fn(tx);
    })) as R;

  const invite = async (tenant: string, hash: string, role: string, prof: string | null, expires = "7 days") =>
    db`insert into team_invites (tenant_id, token_hash, role, professional_id, expires_at)
       values (${tenant}, ${hash}, ${role}, ${prof}, now() + ${expires}::interval)`;

  beforeAll(async () => {
    const u = new URL(url!);
    admin = postgres(url!, { max: 1 });
    await admin.unsafe(`drop database if exists ${nome}`);
    await admin.unsafe(`create database ${nome}`);
    u.pathname = `/${nome}`;
    db = postgres(u.toString(), { max: 4, onnotice: () => {} });

    const arquivos = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const f of arquivos) await db.unsafe(readFileSync(new URL(f, MIGRATIONS), "utf8"));

    for (const id of ["u-novo", "u-novo2", "u-novo3", "u-novo4", "u-novo5"])
      await db`insert into "user" (id, name, email) values (${id}, ${id}, ${id + "@x.com"})`;
    const tenant = async (name: string) => {
      const [{ id }] = await db`insert into tenants (name) values (${name}) returning id`;
      return id as string;
    };
    T.a = await tenant("Studio A");
    T.b = await tenant("Studio B");
    const prof = async (t: string, name: string, pos: number, hash: string | null = null) => {
      const [{ id }] = await db`insert into professionals (tenant_id, display_name, position, calendar_token_hash, calendar_hide_names)
        values (${t}, ${name}, ${pos}, ${hash}, true) returning id`;
      return id as string;
    };
    T.pA = await prof(T.a, "Ana", 0, "hash-ana");
    T.pA2 = await prof(T.a, "Bia", 1);
    T.pB = await prof(T.b, "Cris", 0);
  });

  afterAll(async () => {
    await db?.end();
    await admin?.unsafe(`drop database if exists ${nome}`);
    await admin?.end();
  });

  it("sem salão ativo, o SELECT direto em professionals não devolve nada (FORCE RLS)", async () => {
    const rows = await asApp((tx) => tx`select id from professionals`);
    expect(rows).toHaveLength(0);
  });

  it("feed_owner_by_token_hash acha a dona do link sem salão ativo, e só pelo hash certo", async () => {
    const [r] = await asApp((tx) => tx`select * from feed_owner_by_token_hash('hash-ana')`);
    expect(r).toMatchObject({ id: T.pA, tenant_id: T.a, tenant_name: "Studio A", hide_names: true });
    expect(await asApp((tx) => tx`select * from feed_owner_by_token_hash('outro')`)).toHaveLength(0);
  });

  it("first_professional_of devolve a primeira por posição, sem criar nada", async () => {
    const [r] = await asApp((tx) => tx`select first_professional_of(${T.a}::uuid) as id`);
    expect(r.id).toBe(T.pA);
    const [semSalao] = await asApp((tx) => tx`select first_professional_of(gen_random_uuid()) as id`);
    expect(semSalao.id).toBeNull();
  });

  it("team_invites: RLS por salão (sem salão ativo não vê; com outro salão não vê)", async () => {
    await invite(T.a, "h-rls", "admin", null);
    expect(await asApp((tx) => tx`select id from team_invites`)).toHaveLength(0);
    expect(await asTenant(T.b, (tx) => tx`select id from team_invites`)).toHaveLength(0);
    expect(await asTenant(T.a, (tx) => tx`select id from team_invites where token_hash = 'h-rls'`)).toHaveLength(1);
    await expect(
      asTenant(
        T.b,
        (tx) => tx`insert into team_invites (tenant_id, token_hash, role, expires_at)
        values (${T.a}, 'h-cross', 'admin', now() + interval '1 day')`,
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("convite de profissional exige a profissional (check)", async () => {
    await expect(invite(T.a, "h-sem-prof", "professional", null)).rejects.toMatchObject({ code: "23514" });
  });

  it("team_invite_preview mostra valid, expired e used, e nada para token que não existe", async () => {
    await invite(T.a, "h-ok", "professional", T.pA2);
    await invite(T.a, "h-exp", "admin", null, "-1 hour");
    await invite(T.a, "h-used", "admin", null);
    await db`update team_invites set used_at = now() where token_hash = 'h-used'`;
    const prev = async (h: string) => (await asApp((tx) => tx`select * from team_invite_preview(${h})`))[0];
    expect(await prev("h-ok")).toMatchObject({
      tenant_name: "Studio A",
      role: "professional",
      professional_name: "Bia",
      state: "valid",
    });
    expect((await prev("h-exp"))!.state).toBe("expired");
    expect((await prev("h-used"))!.state).toBe("used");
    expect(await prev("nao-existe")).toBeUndefined();
  });

  it("accept_team_invite cria o vínculo com o papel e a profissional do convite, e marca como usado", async () => {
    const [r] = await asApp((tx) => tx`select accept_team_invite('h-ok', 'u-novo') as t`);
    expect(r.t).toBe(T.a);
    const [m] = await db`select tenant_id, role, professional_id from memberships where user_id = 'u-novo'`;
    expect(m).toEqual({ tenant_id: T.a, role: "professional", professional_id: T.pA2 });
    const [i] = await db`select used_at from team_invites where token_hash = 'h-ok'`;
    expect(i.used_at).not.toBeNull();
  });

  it("segundo uso do mesmo convite falha com INVITE_USED e não cria vínculo", async () => {
    await expect(asApp((tx) => tx`select accept_team_invite('h-ok', 'u-novo2')`)).rejects.toMatchObject({
      message: "INVITE_USED",
    });
    expect(await db`select 1 from memberships where user_id = 'u-novo2'`).toHaveLength(0);
  });

  it("expirado e inexistente falham com o código certo", async () => {
    await expect(asApp((tx) => tx`select accept_team_invite('h-exp', 'u-novo2')`)).rejects.toMatchObject({
      message: "INVITE_EXPIRED",
    });
    await expect(asApp((tx) => tx`select accept_team_invite('nao-existe', 'u-novo2')`)).rejects.toMatchObject({
      message: "INVITE_INVALID",
    });
  });

  it("falha no vínculo desfaz o 'usado' (atomicidade): quem já tem salão não consome o convite", async () => {
    await invite(T.a, "h-admin", "admin", null);
    await expect(asApp((tx) => tx`select accept_team_invite('h-admin', 'u-novo')`)).rejects.toMatchObject({
      code: "23505",
    });
    const [i] = await db`select used_at from team_invites where token_hash = 'h-admin'`;
    expect(i.used_at).toBeNull();
    // e o convite continua valendo para quem ainda não tem salão
    await asApp((tx) => tx`select accept_team_invite('h-admin', 'u-novo3')`);
    const [m] = await db`select role, professional_id from memberships where user_id = 'u-novo3'`;
    expect(m).toEqual({ role: "admin", professional_id: null });
  });

  it("profissional que já ganhou outro login não aceita mais o convite", async () => {
    await invite(T.b, "h-dup", "professional", T.pB);
    await db`insert into memberships (user_id, tenant_id, role, professional_id) values ('u-novo4', ${T.b}, 'professional', ${T.pB})`;
    await expect(asApp((tx) => tx`select accept_team_invite('h-dup', 'u-novo5')`)).rejects.toMatchObject({
      message: "INVITE_INVALID",
    });
  });

  it("as funções não são executáveis por PUBLIC", async () => {
    const [r] = await db`select has_function_privilege('public', 'accept_team_invite(text,text)', 'execute') as ok`;
    expect(r.ok).toBe(false);
  });
});
