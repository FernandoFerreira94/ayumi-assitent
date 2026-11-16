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
vi.mock("@/lib/auth", () => ({
  auth: { api: { verifyTOTP: (...a: unknown[]) => verifyTOTP(...a), verifyBackupCode: vi.fn() } },
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

  it("step-up: sem verificação pede código; 1 h atrás passa; 13 h atrás pede de novo", async () => {
    await expect(guard.requireAdmin()).rejects.toThrow("REDIRECT:/admin/verificar");
    await db`insert into admin_step_up (session_id, user_id, verified_at) values (${SID}, ${ADMIN}, now() - interval '1 hour')`;
    await expect(guard.requireAdmin()).resolves.toEqual({ userId: ADMIN, sessionId: SID });
    await db`update admin_step_up set verified_at = now() - interval '13 hours'`;
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
});
