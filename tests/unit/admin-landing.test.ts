import { describe, expect, it } from "vitest";
import { landingAfterLogin } from "@/features/admin/landing";

describe("landingAfterLogin", () => {
  it("dono do produto vai para o /admin (o 2FA continua no requireAdmin)", () => {
    expect(landingAfterLogin(true)).toBe("/admin");
  });
  it("salão vai para o Painel", () => {
    expect(landingAfterLogin(false)).toBe("/agenda");
  });
  it("sem sessão volta ao login limpando o cookie (evita laço /login ↔ /entrar)", () => {
    expect(landingAfterLogin(null)).toBe("/login?sessao=invalida");
  });
});
