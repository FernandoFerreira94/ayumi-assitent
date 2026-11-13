// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { isEncryptedToken, readToken, writeToken } from "@/features/google/token-crypto";

describe("tokens do Google cifrados", () => {
  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = "s".repeat(40);
  });
  it("cifra e decifra", async () => {
    const enc = await writeToken("ya29.token-de-acesso");
    expect(enc).not.toContain("ya29");
    expect(isEncryptedToken(enc)).toBe(true);
    expect(await readToken(enc)).toBe("ya29.token-de-acesso");
  });
  it("linha antiga em texto puro continua valendo", async () => {
    expect(await readToken("ya29.legado")).toBe("ya29.legado");
    expect(await readToken("1//0g-refresh-legado")).toBe("1//0g-refresh-legado");
    expect(await readToken(null)).toBeNull();
  });
});
