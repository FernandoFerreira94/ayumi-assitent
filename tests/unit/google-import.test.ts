import { describe, expect, it, vi } from "vitest";
import { googleCalendarReader, toExternalEvent, GoogleAuthError } from "@/features/google/calendar";

const timed = {
  id: "a",
  summary: " Dentista ",
  start: { dateTime: "2026-11-10T13:00:00-03:00" },
  end: { dateTime: "2026-11-10T14:00:00-03:00" },
};

describe("toExternalEvent", () => {
  it("aceita evento com hora e limpa o título", () => {
    expect(toExternalEvent(timed)?.title).toBe("Dentista");
  });
  it("ignora dia inteiro, cancelado, livre e recusado", () => {
    expect(toExternalEvent({ id: "b", start: { date: "2026-11-10" } } as never)).toBeNull();
    expect(toExternalEvent({ ...timed, status: "cancelled" })).toBeNull();
    expect(toExternalEvent({ ...timed, transparency: "transparent" })).toBeNull();
    expect(toExternalEvent({ ...timed, attendees: [{ self: true, responseStatus: "declined" }] })).toBeNull();
  });
});

describe("googleCalendarReader", () => {
  const range = [new Date("2026-11-01"), new Date("2026-12-01")] as const;
  it("segue a paginação e envia o intervalo", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [timed], nextPageToken: "p2" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...timed, id: "c" }] })));
    const out = await googleCalendarReader("tok", f as unknown as typeof fetch).listEvents(...range);
    expect(out.map((e) => e.id)).toEqual(["a", "c"]);
    expect(f.mock.calls[0][0]).toContain("singleEvents=true");
    expect(f.mock.calls[1][0]).toContain("pageToken=p2");
  });
  it("401 pede reconexão", async () => {
    const f = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(googleCalendarReader("t", f as unknown as typeof fetch).listEvents(...range)).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });
});
