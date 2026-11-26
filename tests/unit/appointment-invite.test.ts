import { describe, expect, it } from "vitest";
import { inviteIcs } from "@/features/calendar-feed/ics";
import { inviteToken, inviteUrl, readInviteToken } from "@/features/calendar-feed/invite-token";
import { bookingText } from "@/features/messaging/booking";

const env = {
  BETTER_AUTH_SECRET: "s".repeat(40),
  BETTER_AUTH_URL: "https://app.test/",
} as unknown as NodeJS.ProcessEnv;
const T = "0b9d6c1e-2f3a-4b5c-8d7e-9f0a1b2c3d4e";
const A = "7c1f2e3d-4b5a-4968-8776-655443322110";

describe("token do convite", () => {
  it("ida e volta, sem nada além dos ids e da assinatura", () => {
    const t = inviteToken(T, A, env)!;
    expect(t).toMatch(/^[A-Za-z0-9_-]{59}$/);
    expect(readInviteToken(t, env)).toEqual({ tenantId: T, appointmentId: A });
    expect(inviteUrl(T, A, env)).toBe(`https://app.test/api/agenda/convite/${t}.ics`);
  });
  it("recusa token alterado, de outro segredo ou com outro formato", () => {
    const t = inviteToken(T, A, env)!;
    const flipped = t[5] === "A" ? "B" : "A";
    expect(readInviteToken(t.slice(0, 5) + flipped + t.slice(6), env)).toBeNull();
    expect(readInviteToken(t, { BETTER_AUTH_SECRET: "x".repeat(40) } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(readInviteToken("abc", env)).toBeNull();
    expect(readInviteToken(t, {} as NodeJS.ProcessEnv)).toBeNull();
  });
  it("sem segredo ou URL pública, sem link", () => {
    expect(inviteUrl(T, A, { BETTER_AUTH_SECRET: "s".repeat(40) } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(inviteToken("nao-e-uuid", A, env)).toBeNull();
  });
});

describe("ics do convite", () => {
  const base = {
    appointmentId: A,
    start: new Date("2026-11-20T17:30:00Z"),
    end: new Date("2026-11-20T18:30:00Z"),
    service: "Alongamento, Esmaltação",
    salonName: "Studio Yumi",
    address: "Rua A, 10",
    createdAt: new Date("2026-11-16T10:00:00Z"),
    now: new Date("2026-11-16T10:00:30Z"),
  };
  it("serviço, estúdio, endereço, alarme e UID fixo", () => {
    const ics = inviteIcs({ ...base, cancelled: false });
    expect(ics).toContain(`UID:invite-${A}@bubbly`);
    expect(ics).toContain("DTSTART:20261120T173000Z");
    expect(ics).toContain("SUMMARY:Alongamento\\, Esmaltação · Studio Yumi");
    expect(ics).toContain("LOCATION:Rua A\\, 10");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).toContain("SEQUENCE:30");
    expect(ics).toContain("TRIGGER:-PT2H");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("cancelado: mesmo UID, status cancelado, sem alarme, sequência maior", () => {
    const ics = inviteIcs({ ...base, cancelled: true, now: new Date("2026-11-17T10:00:00Z") });
    expect(ics).toContain(`UID:invite-${A}@bubbly`);
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toContain("SUMMARY:Cancelado · ");
    expect(ics).not.toContain("VALARM");
    expect(Number(/SEQUENCE:(\d+)/.exec(ics)![1])).toBeGreaterThan(30);
  });
  it("remarcado: mesmo UID, horário novo e SEQUENCE/LAST-MODIFIED maiores (atualiza o evento salvo)", () => {
    const before = inviteIcs({ ...base, cancelled: false });
    const after = inviteIcs({
      ...base,
      cancelled: false,
      start: new Date("2026-11-21T13:00:00Z"),
      end: new Date("2026-11-21T14:00:00Z"),
      now: new Date("2026-11-18T09:00:00Z"),
    });
    const uid = (ics: string) => /UID:(.+)/.exec(ics)![1];
    const seq = (ics: string) => Number(/SEQUENCE:(\d+)/.exec(ics)![1]);
    expect(uid(after)).toBe(uid(before));
    expect(seq(after)).toBeGreaterThan(seq(before));
    expect(after).toContain("DTSTART:20261121T130000Z");
    expect(after).toContain("LAST-MODIFIED:20261118T090000Z");
    expect(after).toContain("DTSTAMP:20261118T090000Z");
  });
  it("sem endereço, sem LOCATION", () =>
    expect(inviteIcs({ ...base, address: " ", cancelled: false })).not.toContain("LOCATION"));
});

describe("mensagem de agendamento sem link da agenda", () => {
  const a = { client: "Maria", service: "Gel", startsAt: new Date("2026-11-11T17:30:00Z") };
  const eve = new Date("2026-11-10T15:00:00Z");
  it("padrão: termina no texto, sem link", () => {
    const t = bookingText(a, eve);
    expect(t).toMatch(/Te espero com carinho!$/);
    expect(t).not.toContain("agenda:");
  });
  it("texto já salvo com {agenda} numa linha só: a linha some", () =>
    expect(bookingText(a, eve, { template: "Oi {nome}\n\n{agenda}\n\nBeijo" })).toBe("Oi Maria\n\nBeijo"));
  it("{agenda} no meio da frase: só a chave some", () =>
    expect(bookingText(a, eve, { template: "Oi {nome} {agenda}\nBeijo" })).toBe("Oi Maria\nBeijo"));
});
