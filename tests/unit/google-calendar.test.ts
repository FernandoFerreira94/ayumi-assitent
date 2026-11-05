import { describe, expect, it, vi } from "vitest";
import { GoogleApiError, GoogleAuthError, googleCalendar, refreshAccessToken } from "@/features/google/calendar";

const ev = {
  summary: "Gel — Maria",
  startsAt: new Date("2026-11-10T12:00:00Z"),
  endsAt: new Date("2026-11-10T13:00:00Z"),
  timeZone: "America/Sao_Paulo",
};
const res = (status: number, json?: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => json }) as Response;

describe("cliente do Google Agenda", () => {
  it("cria evento com token, fuso e devolve o id", async () => {
    const f = vi.fn().mockResolvedValue(res(200, { id: "evt1" }));
    const id = await googleCalendar("tok", f as unknown as typeof fetch).createEvent(ev);
    expect(id).toBe("evt1");
    const [url, init] = f.mock.calls[0];
    expect(url).toContain("/calendars/primary/events");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body).start).toEqual({
      dateTime: "2026-11-10T12:00:00.000Z",
      timeZone: "America/Sao_Paulo",
    });
  });
  it("401 vira erro de autenticação e 500 vira erro de API", async () => {
    const auth = googleCalendar("t", vi.fn().mockResolvedValue(res(401)) as unknown as typeof fetch);
    await expect(auth.createEvent(ev)).rejects.toBeInstanceOf(GoogleAuthError);
    const api = googleCalendar("t", vi.fn().mockResolvedValue(res(500)) as unknown as typeof fetch);
    await expect(api.updateEvent("x", ev)).rejects.toBeInstanceOf(GoogleApiError);
    const net = googleCalendar("t", vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch);
    await expect(net.createEvent(ev)).rejects.toBeInstanceOf(GoogleApiError);
  });
  it("apagar evento que já não existe não é erro", async () => {
    const cal = googleCalendar("t", vi.fn().mockResolvedValue(res(404)) as unknown as typeof fetch);
    await expect(cal.deleteEvent("gone")).resolves.toBeUndefined();
  });
  it("renova o token e detecta refresh token revogado", async () => {
    const ok = vi.fn().mockResolvedValue(res(200, { access_token: "novo", expires_in: 3600 }));
    const r = await refreshAccessToken("r", "id", "sec", ok as unknown as typeof fetch);
    expect(r.accessToken).toBe("novo");
    expect(r.expiresAt.getTime()).toBeGreaterThan(Date.now());
    const bad = vi.fn().mockResolvedValue(res(400, { error: "invalid_grant" }));
    await expect(refreshAccessToken("r", "id", "sec", bad as unknown as typeof fetch)).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });
});
