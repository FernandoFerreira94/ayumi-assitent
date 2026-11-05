import { describe, expect, it } from "vitest";
import { authErrorText } from "@/app/login/LoginForm";

describe("mensagens de erro do login", () => {
  it.each([
    ["NOT_ALLOWED", "Esta conta não tem acesso."],
    ["INVALID_EMAIL_OR_PASSWORD", "E-mail ou senha incorretos."],
    ["USER_ALREADY_EXISTS", "Este e-mail já tem conta. Entre com a senha."],
    ["PASSWORD_TOO_SHORT", "A senha precisa ter pelo menos 8 caracteres."],
    ["algo_estranho", "Não foi possível entrar. Tente de novo."],
  ])("%s", (code, text) => expect(authErrorText(code)).toBe(text));
  it("sem código não mostra nada", () => expect(authErrorText(null)).toBeNull());
});
