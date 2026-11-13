import { describe, expect, it } from "vitest";
import { redactUrl } from "@/lib/log";

describe("redactUrl", () => {
  it("tira o token do link do calendário", () =>
    expect(redactUrl("https://x.app/api/calendar/oNn33rTZWNy00Qv6ZJ4djzOp_-MVCkqpTRYuaICX7HU.ics?a=1")).toBe(
      "https://x.app/api/calendar/[token]?a=1",
    ));
  it("tira o segredo do webhook na query", () =>
    expect(redactUrl("/api/whatsapp/webhook?token=abc123&x=1")).toBe("/api/whatsapp/webhook?token=[redacted]&x=1"));
  it("não mexe no resto", () => expect(redactUrl("/agenda?dia=2026-11-13")).toBe("/agenda?dia=2026-11-13"));
});
