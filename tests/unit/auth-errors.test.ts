import { describe, expect, it } from "vitest";
import { authErrorText, LOGIN_NOT_ALLOWED } from "@/app/login/LoginForm";

describe("mensagens de erro do login", () => {
  it.each([
    ["NOT_ALLOWED", LOGIN_NOT_ALLOWED],
    ["unable_to_create_user", LOGIN_NOT_ALLOWED],
    ["INVALID_EMAIL_OR_PASSWORD", "E-mail ou senha incorretos."],
    ["USER_ALREADY_EXISTS", "Este e-mail já tem conta. Entre com a senha."],
    ["PASSWORD_TOO_SHORT", "A senha precisa ter pelo menos 8 caracteres."],
    ["algo_estranho", "Não foi possível entrar. Tente de novo."],
  ])("%s", (code, text) => expect(authErrorText(code)).toBe(text));
  it("sem código não mostra nada", () => expect(authErrorText(null)).toBeNull());
});
