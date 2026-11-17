import { describe, expect, it } from "vitest";
import {
  hashInviteToken,
  inviteErrorCode,
  inviteExpiresAt,
  inviteMessage,
  inviteState,
  inviteUrl,
  inviteWhatsappUrl,
  isInviteToken,
  newInviteToken,
} from "@/features/team/invite";
import { ERROR_MESSAGES } from "@/lib/errors";

const now = new Date("2030-01-10T12:00:00Z");

describe("convite: regras puras", () => {
  it("vale 7 dias", () => {
    expect(inviteExpiresAt(now).toISOString()).toBe("2030-01-17T12:00:00.000Z");
  });

  it("estado: válido, usado, expirado e inexistente", () => {
    const future = new Date("2030-01-11T00:00:00Z");
    expect(inviteState({ expiresAt: future, usedAt: null }, now)).toBe("valid");
    expect(inviteState({ expiresAt: future, usedAt: now }, now)).toBe("used");
    expect(inviteState({ expiresAt: new Date("2030-01-09T00:00:00Z"), usedAt: null }, now)).toBe("expired");
    expect(inviteState({ expiresAt: now, usedAt: null }, now)).toBe("expired");
    expect(inviteState(null, now)).toBe("invalid");
  });

  it("estados ruins viram erro do catálogo em português", () => {
    expect(inviteErrorCode("valid")).toBeNull();
    for (const s of ["invalid", "expired", "used"] as const) {
      const code = inviteErrorCode(s)!;
      expect(ERROR_MESSAGES[code]).toBeTruthy();
    }
  });

  it("token tem o formato esperado e o hash não revela o token", () => {
    const t = newInviteToken();
    expect(isInviteToken(t)).toBe(true);
    expect(isInviteToken("curto")).toBe(false);
    expect(hashInviteToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(t)).not.toContain(t);
  });

  it("link e mensagem do WhatsApp", () => {
    const link = inviteUrl("https://app.x.com/", "abc");
    expect(link).toBe("https://app.x.com/convite/abc");
    const msg = inviteMessage(link, "Studio Lu", "Ana Souza");
    expect(msg).toContain("Oi, Ana!");
    expect(msg).toContain(link);
    expect(inviteMessage(link, "Studio Lu")).toContain("Oi!");
    expect(inviteWhatsappUrl(msg)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
});
