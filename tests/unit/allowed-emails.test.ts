import { describe, expect, it } from "vitest";
import { isEmailAllowed, parseAllowedEmails } from "@/lib/allowed-emails";

describe("lista de e-mails autorizados", () => {
  const raw = " Yumi@Gmail.com , outra@x.com ,";
  it("ignora maiúsculas e espaços", () => {
    expect(parseAllowedEmails(raw).size).toBe(2);
    expect(isEmailAllowed("yumi@gmail.com", raw)).toBe(true);
    expect(isEmailAllowed(" OUTRA@x.com ", raw)).toBe(true);
  });
  it("recusa quem não está na lista, vazio ou lista vazia", () => {
    expect(isEmailAllowed("intruso@x.com", raw)).toBe(false);
    expect(isEmailAllowed(null, raw)).toBe(false);
    expect(isEmailAllowed("yumi@gmail.com", "")).toBe(false);
    expect(isEmailAllowed("yumi@gmail.com", undefined)).toBe(false);
  });
});
