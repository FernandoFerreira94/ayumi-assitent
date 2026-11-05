import { describe, expect, it } from "vitest";
import { ERROR_MESSAGES, fail, messageFor, ok } from "@/lib/errors";

describe("catálogo de erros", () => {
  it("todo código tem texto em português", () => {
    for (const msg of Object.values(ERROR_MESSAGES)) expect(msg.length).toBeGreaterThan(10);
  });
  it("código desconhecido cai na mensagem genérica", () => {
    expect(messageFor(undefined)).toBe(ERROR_MESSAGES.UNKNOWN);
  });
  it("ok e fail devolvem o formato das Server Actions", () => {
    expect(ok(3)).toEqual({ ok: true, data: 3 });
    expect(fail("SLOT_TAKEN", "time")).toEqual({ ok: false, code: "SLOT_TAKEN", field: "time" });
  });
});
