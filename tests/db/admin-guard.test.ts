// @vitest-environment node
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { assertTestDatabase } from "../db-guard";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

// Sessão, rotas e Better Auth simulados; step-up e registro usam o Postgres de teste de verdade.
const state = vi.hoisted(() => ({
  session: null as null | { user: { id: string; twoFactorEnabled?: boolean }; session: { id: string } },
}));
vi.mock("@/lib/session", () => ({
  requireSession: async () => {
    if (!state.session) throw new Error("REDIRECT:/login");
    return state.session;
  },
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }) }));
const verifyTOTP = vi.fn();
const generateBackupCodes = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      verifyTOTP: (...a: unknown[]) => verifyTOTP(...a),
      verifyBackupCode: vi.fn(),
      generateBackupCodes: (...a: unknown[]) => generateBackupCodes(...a),
    },
  },
}));

const ADMIN = "adm-guard-u";
const SID = "adm-guard-s";

d("painel do dono: guard e step-up (Postgres real)", () => {
  let db: ReturnType<typeof postgres>;
  let guard: typeof import("@/features/admin/guard");
  let actions: typeof import("@/features/admin/actions");

  beforeAll(async () => {
    assertTestDatabase();
    process.env.ADMIN_USER_IDS = ADMIN;
    db = postgres(url!, { max: 1, onnotice: () => {} });
    await db`delete from "user" where id = ${ADMIN}`;
    await db`insert into "user" (id, name, email, "twoFactorEnabled") values (${ADMIN}, 'Dono', 'dono@t.test', true)`;
    await db`insert into session (id, "expiresAt", token, "userId") values (${SID}, now() + interval '1 day', 'tok-g', ${ADMIN})`;
    guard = await import("@/features/admin/guard");
    actions = await import("@/features/admin/actions");
  });
  afterAll(async () => {
    await db`delete from "user" where id = ${ADMIN}`;
    await db`delete from admin_audit_log where user_id = ${ADMIN}`;
    await db.end();
  });
  beforeEach(async () => {
    verifyTOTP.mockReset();
    generateBackupCodes.mockReset();
    await db`delete from admin_step_up`;
    await db`delete from admin_audit_log where user_id = ${ADMIN}`;
    state.session = { user: { id: ADMIN, twoFactorEnabled: true }, session: { id: SID } };
  });

  it("quem não está em ADMIN_USER_IDS recebe 404, inclusive na action de verificar", async () => {
    state.session = { user: { id: "outra", twoFactorEnabled: true }, session: { id: SID } };
    await expect(guard.requireAdmin()).rejects.toThrow("NOT_FOUND");
    await expect(actions.verifyAdminCode({ code: "123456" })).rejects.toThrow("NOT_FOUND");
    expect(verifyTOTP).not.toHaveBeenCalled();
  });

  it("admin sem 2FA vai para a ativação", async () => {
    state.session = { user: { id: ADMIN, twoFactorEnabled: false }, session: { id: SID } };
    await expect(guard.requireAdmin()).rejects.toThrow("REDIRECT:/admin/ativar-2fa");
  });

  it("step-up: sem verificação pede código; 6 dias atrás passa; 8 dias atrás pede de novo", async () => {
    await expect(guard.requireAdmin()).rejects.toThrow("REDIRECT:/admin/verificar");
    await db`insert into admin_step_up (session_id, user_id, verified_at) values (${SID}, ${ADMIN}, now() - interval '6 days')`;
    await expect(guard.requireAdmin()).resolves.toEqual({ userId: ADMIN, sessionId: SID });
    await db`update admin_step_up set verified_at = now() - interval '8 days'`;
    await expect(guard.requireAdmin()).rejects.toThrow("REDIRECT:/admin/verificar");
  });

  it("código certo grava o step-up e o acesso com IP", async () => {
    verifyTOTP.mockResolvedValue({ token: "x" });
    await expect(actions.verifyAdminCode({ code: "123 456" })).resolves.toEqual({ ok: true, data: undefined });
    expect(await db`select 1 from admin_step_up where session_id = ${SID}`).toHaveLength(1);
    const [row] = await db`select action, ip from admin_audit_log where user_id = ${ADMIN}`;
    expect(row).toEqual({ action: "step_up_ok", ip: "203.0.113.9" });
  });

  it("5 códigos errados travam: o 6º falha mesmo certo, sem chamar o Better Auth", async () => {
    verifyTOTP.mockRejectedValue({ body: { code: "INVALID_CODE" } });
    for (let i = 0; i < 5; i++) {
      expect(await actions.verifyAdminCode({ code: "000000" })).toEqual({
        ok: false,
        code: "ADMIN_STEP_UP_INVALID",
        field: "code",
      });
    }
    expect(await db`select 1 from admin_audit_log where action = 'step_up_failed'`).toHaveLength(5);
    verifyTOTP.mockReset().mockResolvedValue({ token: "x" });
    expect(await actions.verifyAdminCode({ code: "123456" })).toEqual({ ok: false, code: "ADMIN_STEP_UP_LOCKED" });
    expect(verifyTOTP).not.toHaveBeenCalled();
    expect(await db`select 1 from admin_step_up`).toHaveLength(0);
  });

  it("código com formato inválido nem chega ao Better Auth", async () => {
    expect(await actions.verifyAdminCode({ code: "12" })).toMatchObject({ ok: false, code: "ADMIN_STEP_UP_INVALID" });
    expect(verifyTOTP).not.toHaveBeenCalled();
  });

  it("tentativas em paralelo: só uma chega ao Better Auth, as outras voltam 'ocupado'", async () => {
    verifyTOTP.mockImplementation(() => new Promise((_, rej) => setTimeout(() => rej({ body: { code: "INVALID_CODE" } }), 150)));
    const rs = await Promise.all(Array.from({ length: 8 }, () => actions.verifyAdminCode({ code: "000000" })));
    expect(verifyTOTP).toHaveBeenCalledTimes(1);
    expect(rs.filter((r) => !r.ok && r.code === "ADMIN_STEP_UP_BUSY")).toHaveLength(7);
    expect(await db`select 1 from admin_audit_log where action = 'step_up_failed'`).toHaveLength(1);
  });

  it("gerar novos códigos de recuperação exige o código do app", async () => {
    await db`insert into admin_step_up (session_id, user_id) values (${SID}, ${ADMIN})`;
    generateBackupCodes.mockResolvedValue({ backupCodes: ["aaaaa-bbbbb"] });
    expect(await actions.regenerateBackupCodes({ code: "" })).toMatchObject({ ok: false, code: "ADMIN_STEP_UP_INVALID" });
    verifyTOTP.mockRejectedValue({ body: { code: "INVALID_CODE" } });
    expect(await actions.regenerateBackupCodes({ code: "000000" })).toMatchObject({ ok: false, code: "ADMIN_STEP_UP_INVALID" });
    expect(generateBackupCodes).not.toHaveBeenCalled();
    verifyTOTP.mockReset().mockResolvedValue({ token: "x" });
    expect(await actions.regenerateBackupCodes({ code: "123456" })).toEqual({ ok: true, data: { backupCodes: ["aaaaa-bbbbb"] } });
    expect(generateBackupCodes).toHaveBeenCalledTimes(1);
  });

  it("desconectar outros aparelhos apaga as outras sessões e mantém a atual", async () => {
    await db`insert into admin_step_up (session_id, user_id) values (${SID}, ${ADMIN})`;
    await db`insert into session (id, "expiresAt", token, "userId") values
      ('adm-other-1', now() + interval '1 day', 'tok-o1', ${ADMIN}), ('adm-other-2', now() + interval '1 day', 'tok-o2', ${ADMIN})`;
    expect(await actions.endOtherSessions()).toEqual({ ok: true, data: { ended: 2 } });
    expect((await db`select id from session where "userId" = ${ADMIN}`).map((r) => r.id)).toEqual([SID]);
    expect(await db`select target from admin_audit_log where action = 'sessions_revoked'`).toEqual([{ target: "2" }]);
  });

  it("abrir a mesma tela de novo em 2 min não repete a linha do registro", async () => {
    const { logAdminAccess } = await import("@/features/admin/audit");
    await logAdminAccess({ userId: ADMIN, action: "view_overview" });
    await logAdminAccess({ userId: ADMIN, action: "view_overview" });
    await logAdminAccess({ userId: ADMIN, action: "view_subscriber", target: "a" });
    await logAdminAccess({ userId: ADMIN, action: "view_subscriber", target: "b" });
    await logAdminAccess({ userId: ADMIN, action: "export_payments", target: "2026-10" });
    await logAdminAccess({ userId: ADMIN, action: "export_payments", target: "2026-10" });
    const rows = await db`select action from admin_audit_log where user_id = ${ADMIN} order by id`;
    expect(rows.map((r) => r.action)).toEqual(["view_overview", "view_subscriber", "view_subscriber", "export_payments", "export_payments"]);
  });

  it("uso: conta agendamentos, mensagens e clientes de cada salão, como dono do banco", async () => {
    await db`insert into admin_step_up (session_id, user_id) values (${SID}, ${ADMIN})`;
    const [{ id: T }] = await db`insert into tenants (name, owner_name, whatsapp_instance) values ('Uso A', 'Ana', 'inst-uso-a') returning id`;
    const [{ id: S }] = await db`insert into services (tenant_id,name,duration_min,price_cents) values (${T},'Gel',60,10000) returning id`;
    const [{ id: C }] = await db`insert into clients (tenant_id,name,phone_e164) values (${T},'X','+5511900000099') returning id`;
    await db`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status) values
      (${T},${C},${S},now() - interval '2 days',now() - interval '2 days' + interval '1 hour',10000,'done'),
      (${T},${C},${S},now() - interval '3 days',now() - interval '3 days' + interval '1 hour',10000,'cancelled'),
      (${T},${C},${S},now() - interval '40 days',now() - interval '40 days' + interval '1 hour',10000,'done')`;
    await db`insert into messages (tenant_id,client_id,direction,kind,body) values
      (${T},${C},'out','reminder','a'),(${T},${C},'out','reminder','b'),(${T},${C},'in','client','c')`;
    await db`insert into memberships (user_id, tenant_id) values (${ADMIN}, ${T})`;
    try {
      const { getUsage } = await import("@/features/admin/usage");
      const r = (await getUsage()).find((u) => u.tenantId === T)!;
      expect(r).toMatchObject({ salonName: "Uso A", ownerName: "Ana", whatsapp: true, clients: 1, appts30: 1, msgsOut30: 2, msgsIn30: 1 });
      expect(r.lastSeenAt).toBeInstanceOf(Date);
    } finally {
      await db`delete from tenants where id = ${T}`;
    }
  });
});
