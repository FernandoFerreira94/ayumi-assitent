import { describe, expect, it } from "vitest";
import { buildIcs, escapeText, eventTitle, foldLine, icsDate } from "@/features/calendar-feed/ics";
import { hashToken, isTokenShape, newToken } from "@/features/calendar-feed/token";

describe("ics", () => {
  it("data em UTC sem separadores", () =>
    expect(icsDate(new Date("2026-11-13T12:30:00.000Z"))).toBe("20261113T123000Z"));
  it("escapa vírgula, ponto e vírgula, barra e quebra", () =>
    expect(escapeText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne"));
  it("dobra linhas longas em até 75 octetos", () => {
    const folded = foldLine("SUMMARY:" + "ç".repeat(60));
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe("SUMMARY:" + "ç".repeat(60));
  });
  it("título com primeiro nome, oculto e pendente", () => {
    expect(eventTitle({ clientName: "Ana Souza", service: "Corte", status: "confirmed", hideNames: false })).toBe(
      "Ana · Corte",
    );
    expect(eventTitle({ clientName: "Ana Souza", service: "Corte", status: "confirmed", hideNames: true })).toBe(
      "Atendimento · Corte",
    );
    expect(eventTitle({ clientName: "Ana", service: "Corte", status: "pending_confirmation", hideNames: false })).toBe(
      "Ana · Corte (a confirmar)",
    );
  });
  it("monta o calendário com CRLF e um VEVENT por item", () => {
    const now = new Date("2026-11-13T00:00:00Z");
    const ics = buildIcs({
      calName: "Bubbly · Studio",
      now,
      events: [
        {
          uid: "abc@bubbly",
          start: new Date("2026-11-14T12:00:00Z"),
          end: new Date("2026-11-14T13:00:00Z"),
          title: "Ana · Corte, escova",
        },
      ],
    });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:abc@bubbly\r\n");
    expect(ics).toContain("DTSTART:20261114T120000Z\r\n");
    expect(ics).toContain("SUMMARY:Ana · Corte\\, escova\r\n");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
});

describe("token", () => {
  it("gera 43 caracteres base64url e diferentes", () => {
    const a = newToken();
    expect(isTokenShape(a)).toBe(true);
    expect(a).not.toBe(newToken());
  });
  it("hash determinístico e formato inválido recusado", () => {
    expect(hashToken("x")).toBe(hashToken("x"));
    expect(hashToken("x")).toHaveLength(64);
    expect(isTokenShape("../etc")).toBe(false);
    expect(isTokenShape("a".repeat(44))).toBe(false);
  });
});

describe("ics: casos da revisão", () => {
  it("tira caractere de controle e trata \\r sozinho", () =>
    expect(escapeText("a\u0000b\u0007c\rd\te")).toBe("abc\\nd\te"));
  it("nome do calendário sem vírgula, ponto e vírgula ou barra", () => {
    const ics = buildIcs({ calName: "Bubbly · Studio, da Yumi; teste\\x", events: [] });
    expect(ics).toContain("X-WR-CALNAME:Bubbly · Studio da Yumi teste x\r\n");
  });
  it("falta marcada no título", () =>
    expect(eventTitle({ clientName: "Ana", service: "Corte", status: "no_show", hideNames: false })).toBe(
      "Ana · Corte (faltou)",
    ));
  it("sem LAST-MODIFIED falso (era sempre a hora do pedido)", () => {
    const ics = buildIcs({
      calName: "x",
      events: [{ uid: "u@bubbly", start: new Date(0), end: new Date(3_600_000), title: "t" }],
    });
    expect(ics).not.toContain("LAST-MODIFIED");
  });
});
