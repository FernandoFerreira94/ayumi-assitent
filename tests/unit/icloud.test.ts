import { describe, expect, it } from "vitest";
import { normalizeIcloudUrl, parseIcsEvents } from "@/features/calendar-feed/icloud";

const ics = (body: string) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Apple Inc.//iCloud//EN", body, "END:VCALENDAR"].join("\r\n");

const SP_TZ = [
  "BEGIN:VTIMEZONE",
  "TZID:America/Sao_Paulo",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:-0300",
  "TZOFFSETTO:-0300",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

const from = new Date("2026-11-01T00:00:00Z");
const to = new Date("2026-12-01T00:00:00Z");

describe("normalizeIcloudUrl", () => {
  it("aceita webcal do iCloud e devolve https", () => {
    expect(normalizeIcloudUrl(" webcal://p52-caldav.icloud.com/published/2/ABC123 ")).toBe(
      "https://p52-caldav.icloud.com/published/2/ABC123",
    );
  });
  it("recusa outros hosts, caminhos e truques", () => {
    for (const bad of [
      "",
      "https://evil.com/published/2/x",
      "https://icloud.com.evil.com/published/2/x",
      "https://p52-caldav.icloud.com/private/x",
      "http://p52-caldav.icloud.com/published/2/x",
      "https://user:pw@p52-caldav.icloud.com/published/2/x",
      "https://p52-caldav.icloud.com:8443/published/2/x",
      "file:///etc/passwd",
      "não é link",
    ])
      expect(normalizeIcloudUrl(bad), bad).toBeNull();
  });
});

describe("parseIcsEvents", () => {
  it("lê evento com fuso, tira dia inteiro, cancelado, livre e o nosso link", () => {
    const text = ics(
      [
        SP_TZ,
        "BEGIN:VEVENT\r\nUID:a1\r\nSUMMARY:Maria - Corte\r\nDTSTART;TZID=America/Sao_Paulo:20261110T090000\r\nDTEND;TZID=America/Sao_Paulo:20261110T100000\r\nEND:VEVENT",
        "BEGIN:VEVENT\r\nUID:a2\r\nSUMMARY:Aniversário\r\nDTSTART;VALUE=DATE:20261111\r\nDTEND;VALUE=DATE:20261112\r\nEND:VEVENT",
        "BEGIN:VEVENT\r\nUID:a3\r\nSUMMARY:Cancelado\r\nSTATUS:CANCELLED\r\nDTSTART:20261112T120000Z\r\nDTEND:20261112T130000Z\r\nEND:VEVENT",
        "BEGIN:VEVENT\r\nUID:a4\r\nSUMMARY:Livre\r\nTRANSP:TRANSPARENT\r\nDTSTART:20261112T140000Z\r\nDTEND:20261112T150000Z\r\nEND:VEVENT",
        "BEGIN:VEVENT\r\nUID:x@bubbly\r\nSUMMARY:Ana · Corte\r\nDTSTART:20261113T120000Z\r\nDTEND:20261113T130000Z\r\nEND:VEVENT",
        "BEGIN:VEVENT\r\nUID:old\r\nSUMMARY:Fora da janela\r\nDTSTART:20250101T120000Z\r\nDTEND:20250101T130000Z\r\nEND:VEVENT",
      ].join("\r\n"),
    );
    const evs = parseIcsEvents(text, from, to);
    expect(evs).toEqual([
      {
        uid: "a1",
        title: "Maria - Corte",
        startsAt: new Date("2026-11-10T12:00:00Z"),
        endsAt: new Date("2026-11-10T13:00:00Z"),
      },
    ]);
  });

  it("hora sem fuso vale o horário do estúdio (UTC-3)", () => {
    const text = ics(
      "BEGIN:VEVENT\r\nUID:f1\r\nSUMMARY:Flutuante\r\nDTSTART:20261110T090000\r\nDTEND:20261110T093000\r\nEND:VEVENT",
    );
    expect(parseIcsEvents(text, from, to)[0].startsAt).toEqual(new Date("2026-11-10T12:00:00Z"));
  });

  it("abre repetição semanal, respeita EXDATE e exceção (RECURRENCE-ID)", () => {
    const text = ics(
      [
        SP_TZ,
        "BEGIN:VEVENT\r\nUID:r1\r\nSUMMARY:Academia\r\nDTSTART;TZID=America/Sao_Paulo:20261102T070000\r\nDTEND;TZID=America/Sao_Paulo:20261102T080000\r\nRRULE:FREQ=WEEKLY;COUNT=4\r\nEXDATE;TZID=America/Sao_Paulo:20261109T070000\r\nEND:VEVENT",
        "BEGIN:VEVENT\r\nUID:r1\r\nRECURRENCE-ID;TZID=America/Sao_Paulo:20261116T070000\r\nSUMMARY:Academia (tarde)\r\nDTSTART;TZID=America/Sao_Paulo:20261116T170000\r\nDTEND;TZID=America/Sao_Paulo:20261116T180000\r\nEND:VEVENT",
      ].join("\r\n"),
    );
    const evs = parseIcsEvents(text, from, to);
    expect(evs.map((e) => [e.title, e.startsAt.toISOString()])).toEqual([
      ["Academia", "2026-11-02T10:00:00.000Z"],
      ["Academia (tarde)", "2026-11-16T20:00:00.000Z"],
      ["Academia", "2026-11-23T10:00:00.000Z"],
    ]);
    expect(new Set(evs.map((e) => e.uid)).size).toBe(3);
  });

  it("repetição antiga diária ainda chega na janela", () => {
    const text = ics(
      "BEGIN:VEVENT\r\nUID:d1\r\nSUMMARY:Remédio\r\nDTSTART:20150101T110000Z\r\nDTEND:20150101T111500Z\r\nRRULE:FREQ=DAILY\r\nEND:VEVENT",
    );
    expect(parseIcsEvents(text, from, to)).toHaveLength(30);
  });

  it("lança se não for calendário", () => {
    expect(() => parseIcsEvents("<html>oi</html>", from, to)).toThrow();
  });
});
