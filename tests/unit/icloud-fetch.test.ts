// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fetchIcloudIcs } from "@/features/calendar-feed/icloud-server";

const OK_URL = "https://p52-caldav.icloud.com/published/2/abc";
const CAL = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR";

function fake(routes: Record<string, () => Response>) {
  const seen: string[] = [];
  const f = (async (input: URL | RequestInfo) => {
    const u = String(input);
    seen.push(u);
    const r = routes[u];
    if (!r) throw new Error("rede");
    return r();
  }) as typeof fetch;
  return { f, seen };
}

describe("fetchIcloudIcs", () => {
  it("segue o redirecionamento do iCloud (webcal para outro pXX)", async () => {
    const { f, seen } = fake({
      [OK_URL]: () =>
        new Response(null, { status: 301, headers: { location: "webcal://p99-caldav.icloud.com/published/2/abc" } }),
      "https://p99-caldav.icloud.com/published/2/abc": () => new Response(CAL),
    });
    expect(await fetchIcloudIcs(OK_URL, f)).toContain("VCALENDAR");
    expect(seen).toHaveLength(2);
  });

  it("não segue redirecionamento para fora do iCloud (SSRF)", async () => {
    const { f, seen } = fake({
      [OK_URL]: () => new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } }),
    });
    await expect(fetchIcloudIcs(OK_URL, f)).rejects.toMatchObject({ kind: "failed" });
    expect(seen).toEqual([OK_URL]);
  });

  it("404 = calendário não existe mais; HTML = não é calendário; grande demais", async () => {
    await expect(
      fetchIcloudIcs(OK_URL, fake({ [OK_URL]: () => new Response("x", { status: 404 }) }).f),
    ).rejects.toMatchObject({
      kind: "not_found",
    });
    await expect(fetchIcloudIcs(OK_URL, fake({ [OK_URL]: () => new Response("<html>") }).f)).rejects.toMatchObject({
      kind: "not_calendar",
    });
    const big = "BEGIN:VCALENDAR\r\n" + "X".repeat(2 * 1024 * 1024 + 10);
    await expect(fetchIcloudIcs(OK_URL, fake({ [OK_URL]: () => new Response(big) }).f)).rejects.toMatchObject({
      kind: "too_big",
    });
  });
});
