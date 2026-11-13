import { beforeEach, describe, expect, it, vi } from "vitest";

const setPassword = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: { api: { setPassword: (...a: unknown[]) => setPassword(...a) } } }));
vi.mock("@/lib/tenant", () => ({ requireTenant: async () => ({ tenantId: "t", userId: "u", userName: "U" }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/features/google/server", () => ({ syncAppointmentSafe: vi.fn() }));

const { createPassword } = await import("@/features/google/actions");

const form = (password: string, confirm = password) => {
  const fd = new FormData();
  fd.set("password", password);
  fd.set("confirm", confirm);
  return fd;
};

describe("createPassword", () => {
  beforeEach(() => setPassword.mockReset());

  it("cria a senha pelo Better Auth", async () => {
    setPassword.mockResolvedValue({ status: true });
    expect(await createPassword(null, form("senha-boa-1"))).toEqual({ ok: true, data: undefined });
    expect(setPassword).toHaveBeenCalledWith(expect.objectContaining({ body: { newPassword: "senha-boa-1" } }));
  });

  it("barra senha curta e senhas diferentes sem chamar o servidor", async () => {
    expect(await createPassword(null, form("curta"))).toMatchObject({ ok: false, field: "password" });
    expect(await createPassword(null, form("senha-boa-1", "outra-1234"))).toMatchObject({
      ok: false,
      field: "confirm",
    });
    expect(setPassword).not.toHaveBeenCalled();
  });

  it("senha já existente conta como sucesso; outro erro vira UNKNOWN", async () => {
    setPassword.mockRejectedValueOnce({ body: { code: "PASSWORD_ALREADY_SET" } });
    expect(await createPassword(null, form("senha-boa-1"))).toMatchObject({ ok: true });
    setPassword.mockRejectedValueOnce(new Error("db"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await createPassword(null, form("senha-boa-1"))).toMatchObject({ ok: false, code: "UNKNOWN" });
  });
});
