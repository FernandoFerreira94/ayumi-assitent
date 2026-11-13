import { describe, expect, it } from "vitest";
import { errCode, redactUrl } from "@/lib/log";

describe("redactUrl", () => {
  it("tira o token do link do calendário", () =>
    expect(redactUrl("https://x.app/api/calendar/oNn33rTZWNy00Qv6ZJ4djzOp_-MVCkqpTRYuaICX7HU.ics?a=1")).toBe(
      "https://x.app/api/calendar/[token]?a=1",
    ));
  it("tira o segredo do webhook na query", () =>
    expect(redactUrl("/api/whatsapp/webhook?token=abc123&x=1")).toBe("/api/whatsapp/webhook?token=[redacted]&x=1"));
  it("não mexe no resto", () => expect(redactUrl("/agenda?dia=2026-11-13")).toBe("/agenda?dia=2026-11-13"));
  it("tira o id da conversa e do aviso", () =>
    expect(redactUrl("/agenda?conversa=123&aviso=9")).toBe("/agenda?conversa=[redacted]&aviso=[redacted]"));
});

describe("errCode", () => {
  it("guarda tipo, código e constraint, nunca a mensagem", () => {
    const e = Object.assign(new Error("número +5511999990000 recusado"), { code: "23505", constraint_name: "x_key" });
    expect(errCode(e)).toEqual({ err: "Error", code: "23505", constraint: "x_key" });
    expect(JSON.stringify(errCode(e))).not.toContain("5511");
    expect(errCode("texto solto")).toEqual({ err: "string" });
  });
});
