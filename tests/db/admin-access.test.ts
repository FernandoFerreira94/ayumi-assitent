// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertTestDatabase } from "../db-guard";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("painel do dono: tabelas de acesso (Postgres real)", () => {
  let admin: ReturnType<typeof postgres>;
  let runRetention: typeof import("@/features/retention/run").runRetention;
  const uid = "admin-access-u";

  beforeAll(async () => {
    assertTestDatabase();
    ({ runRetention } = await import("@/features/retention/run"));
    admin = postgres(url!, { max: 1, onnotice: () => {} });
    await admin`delete from "user" where id = ${uid}`;
    await admin`truncate admin_audit_log, admin_step_up`;
    await admin`insert into "user" (id, name, email) values (${uid}, ${uid}, ${uid + "@t.test"})`;
  });
  afterAll(async () => {
    await admin`delete from "user" where id = ${uid}`;
    await admin.end();
  });

  it("app_user não lê nada do painel nem do 2FA", async () => {
    for (const t of ["admin_audit_log", "admin_step_up", '"twoFactor"']) {
      await expect(
        admin.begin(async (tx) => {
          await tx`set local role app_user`;
          await tx.unsafe(`select 1 from ${t} limit 1`);
        }),
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("apagar a sessão (logout) apaga a verificação dela", async () => {
    await admin`insert into session (id, "expiresAt", token, "userId") values ('s-adm', now() + interval '1 day', 'tok-adm', ${uid})`;
    await admin`insert into admin_step_up (session_id, user_id) values ('s-adm', ${uid})`;
    await admin`delete from session where id = 's-adm'`;
    expect(await admin`select 1 from admin_step_up where session_id = 's-adm'`).toHaveLength(0);
  });

  it("excluir a conta apaga o segredo do 2FA", async () => {
    await admin`insert into "twoFactor" (id, secret, "backupCodes", "userId") values ('tf1', 'x', 'y', ${uid})`;
    expect((await admin`select "twoFactorEnabled" from "user" where id = ${uid}`)[0].twoFactorEnabled).toBe(false);
    await admin`delete from "user" where id = ${uid}`;
    expect(await admin`select 1 from "twoFactor" where id = 'tf1'`).toHaveLength(0);
    await admin`insert into "user" (id, name, email) values (${uid}, ${uid}, ${uid + "@t.test"})`;
  });

  it("retenção: log do painel > 12 meses e verificação > 12 h saem; o resto fica", async () => {
    const now = new Date("2026-11-20T12:00:00Z");
    await admin`insert into admin_audit_log (user_id, action, created_at) values
      (${uid}, 'view_overview', '2025-11-01T00:00:00Z'), (${uid}, 'view_overview', '2026-10-01T00:00:00Z')`;
    await admin`insert into session (id, "expiresAt", token, "userId") values
      ('s-old', now() + interval '1 day', 'tok-old', ${uid}), ('s-new', now() + interval '1 day', 'tok-new', ${uid})`;
    await admin`insert into admin_step_up (session_id, user_id, verified_at) values
      ('s-old', ${uid}, '2026-11-19T23:00:00Z'), ('s-new', ${uid}, '2026-11-20T11:00:00Z')`;
    const r = await runRetention(now);
    expect(r).toMatchObject({ adminAudit: 1, adminStepUp: 1 });
    expect(await admin`select 1 from admin_audit_log`).toHaveLength(1);
    expect((await admin`select session_id from admin_step_up`).map((x) => x.session_id)).toEqual(["s-new"]);
  });
});
