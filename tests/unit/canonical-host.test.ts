import { describe, expect, it } from "vitest";
import { canonicalRedirect } from "@/lib/canonical-host";

const env = { BETTER_AUTH_URL: "https://app.bubbly.app.br" } as unknown as NodeJS.ProcessEnv;
const old = "ayumi-assitent-production.up.railway.app";

describe("canonicalRedirect", () => {
  it("leva o endereço antigo do Railway para o domínio oficial, com caminho e busca", () => {
    const to = canonicalRedirect(old, new URL(`https://${old}/agenda?dia=2026-11-16`), env);
    expect(to?.toString()).toBe("https://app.bubbly.app.br/agenda?dia=2026-11-16");
  });

  it("não mexe quando já está no domínio oficial", () => {
    expect(canonicalRedirect("app.bubbly.app.br", new URL("https://app.bubbly.app.br/agenda"), env)).toBeNull();
  });

  it("não mexe em localhost nem sem BETTER_AUTH_URL", () => {
    expect(canonicalRedirect("localhost:3000", new URL("http://localhost:3000/"), env)).toBeNull();
    expect(canonicalRedirect(old, new URL(`https://${old}/`), {} as NodeJS.ProcessEnv)).toBeNull();
  });

  it("rollback: BETTER_AUTH_URL de volta no endereço antigo desliga o redirecionamento", () => {
    const back = { BETTER_AUTH_URL: `https://${old}` } as unknown as NodeJS.ProcessEnv;
    expect(canonicalRedirect(old, new URL(`https://${old}/agenda`), back)).toBeNull();
  });
});
