import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  challengeOf,
  codeKey,
  cookieHeaderFrom,
  linkReturnUrl,
  isChallenge,
  newCode,
  returnUrl,
  safeErrorCode,
  verifierMatches,
} from "@/features/native/handoff-core";
import { linkBackPath } from "@/features/native/google-login";

const VERIFIER = "a".repeat(43);

describe("login do Google no app da loja: segredo do app", () => {
  it("challenge é o SHA-256 em base64url do segredo (igual ao crypto.subtle do app)", () => {
    const expected = createHash("sha256").update(VERIFIER).digest("base64url");
    expect(challengeOf(VERIFIER)).toBe(expected);
    expect(isChallenge(challengeOf(VERIFIER))).toBe(true);
  });
  it("só o segredo certo abre a sessão", () => {
    const ch = challengeOf(VERIFIER);
    expect(verifierMatches(VERIFIER, ch)).toBe(true);
    expect(verifierMatches("b".repeat(43), ch)).toBe(false);
  });
  it("recusa formato inválido sem quebrar", () => {
    expect(verifierMatches("curto", challengeOf(VERIFIER))).toBe(false);
    expect(verifierMatches(VERIFIER, "x")).toBe(false);
    expect(verifierMatches(undefined, undefined)).toBe(false);
    expect(isChallenge("a/b+c".padEnd(43, "a"))).toBe(false);
  });
});

describe("código de volta", () => {
  it("é aleatório e a chave guardada é o hash, não o código", () => {
    const a = newCode();
    expect(a).not.toBe(newCode());
    expect(codeKey(a)).not.toContain(a);
    expect(codeKey(a).startsWith("native-auth:")).toBe(true);
  });
  it("link de volta usa o esquema do app e limpa o erro", () => {
    expect(returnUrl({ code: "abc_-1" })).toBe("br.app.bubbly://auth?code=abc_-1");
    expect(returnUrl({ error: "NOT_ALLOWED" })).toBe("br.app.bubbly://auth?error=NOT_ALLOWED");
    expect(returnUrl({ error: "<script>" })).toBe("br.app.bubbly://auth?error=UNKNOWN");
    expect(safeErrorCode(42)).toBe("UNKNOWN");
  });
});

describe("ligar o Google Agenda no app da loja", () => {
  it("link de volta só diz se deu certo, com erro limpo", () => {
    expect(linkReturnUrl({ ok: true })).toBe("br.app.bubbly://google?ok=1");
    expect(linkReturnUrl({ error: "access_denied" })).toBe("br.app.bubbly://google?error=access_denied");
    expect(linkReturnUrl({ error: "x&y=1" })).toBe("br.app.bubbly://google?error=UNKNOWN");
  });
  it("passa só nome=valor dos cookies da sessão para a chamada interna", () => {
    expect(
      cookieHeaderFrom([
        "__Secure-better-auth.session_token=abc.def; Path=/; HttpOnly; Secure; SameSite=Lax",
        "better-auth.dont_remember=; Max-Age=0",
      ]),
    ).toBe("__Secure-better-auth.session_token=abc.def");
  });
  it("volta para a tela que começou, e só para as conhecidas", () => {
    expect(linkBackPath("/primeiro-acesso?etapa=agenda", null)).toBe("/primeiro-acesso?etapa=agenda");
    expect(linkBackPath("https://mal.example", null)).toBe("/ajustes/calendarios");
    expect(linkBackPath(null, "access_denied")).toBe("/ajustes/calendarios?google=erro&error=access_denied");
    expect(linkBackPath("/primeiro-acesso?etapa=agenda", "<x>")).toBe(
      "/primeiro-acesso?etapa=agenda&google=erro&error=UNKNOWN",
    );
  });
});
