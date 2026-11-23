import { describe, expect, it } from "vitest";
import { bookingText, reminderText, secondReminderText } from "@/features/reminders/text";
import {
  chooseSession,
  parseSessionUse,
  sessionMessageLine,
  sessionUseText,
  totalWithSession,
  type PackageOnHand,
} from "@/features/wallet/session-use";

const pkg = (over: Partial<PackageOnHand> = {}): PackageOnHand => ({
  id: "p1",
  name: "Fibra 6",
  serviceIds: ["fibra"],
  sessionsTotal: 6,
  priceCents: 60001,
  expiresOn: "2030-12-31",
  left: 4,
  ...over,
});

describe("uso do pacote (agendar, cartão e mensagens)", () => {
  it("escolhe o pacote valendo que cobre o serviço; sessão 3 de 6, restam 3 depois", () => {
    const p = chooseSession([pkg()], ["fibra", "esmalte"], "2030-08-01");
    expect(p).toMatchObject({ clientPackageId: "p1", left: 3, total: 6, valueCents: 10000 });
    expect(sessionUseText({ n: p!.total - p!.left, total: p!.total, left: p!.left })).toBe("Sessão 3 de 6 · restam 3");
  });

  it("última sessão leva a sobra dos centavos", () => {
    expect(chooseSession([pkg({ left: 1 })], ["fibra"], "2030-08-01")?.valueCents).toBe(10001);
  });

  it("vencido, sem sessão ou de outro serviço não entra", () => {
    expect(chooseSession([pkg({ expiresOn: "2030-07-31" })], ["fibra"], "2030-08-01")).toBeNull();
    expect(chooseSession([pkg({ left: 0 })], ["fibra"], "2030-08-01")).toBeNull();
    expect(chooseSession([pkg()], ["esmalte"], "2030-08-01")).toBeNull();
    // vence no próprio dia ainda vale
    expect(chooseSession([pkg({ expiresOn: "2030-08-01" })], ["fibra"], "2030-08-01")).not.toBeNull();
  });

  it("total: a sessão cobre o serviço mais caro do pacote; o resto fica a pagar", () => {
    const p = chooseSession([pkg({ serviceIds: ["fibra", "esmalte"] })], ["fibra"], "2030-08-01");
    const booked = [
      { id: "fibra", priceCents: 12000 },
      { id: "esmalte", priceCents: 3000 },
      { id: "sobrancelha", priceCents: 2000 },
    ];
    expect(totalWithSession(17000, booked, p)).toEqual({ totalCents: 15000, owedCents: 5000 });
    expect(totalWithSession(17000, booked, null)).toEqual({ totalCents: 17000, owedCents: 17000 });
  });

  it("lê o JSON do banco; sem segurar sessão = null", () => {
    expect(parseSessionUse({ name: "Fibra", n: 2, total: 6, left: 4, held: true })).toEqual({
      name: "Fibra",
      n: 2,
      total: 6,
      left: 4,
    });
    expect(parseSessionUse('{"name":"Fibra","n":2,"total":6,"left":0,"held":true}')?.left).toBe(0);
    expect(parseSessionUse({ name: "Fibra", n: 0, total: 6, left: 4, held: false })).toBeNull();
    expect(parseSessionUse(null)).toBeNull();
    expect(sessionUseText({ n: 6, total: 6, left: 0 })).toBe("Sessão 6 de 6 · não restam mais");
    expect(sessionUseText({ n: 5, total: 6, left: 1 })).toBe("Sessão 5 de 6 · resta 1");
  });

  it("mensagens: uma linha sutil, sem valor nem nome do pacote; sem pacote, nada muda", () => {
    const a = { client: "Ana Lima", service: "Fibra", startsAt: new Date("2030-08-02T17:00:00Z") };
    const now = new Date("2030-08-01T12:00:00Z");
    const line = sessionMessageLine({ n: 3, total: 6 });
    expect(line).toBe("✨ Sessão 3 de 6 do seu pacote");
    expect(bookingText({ ...a, session: { n: 3, total: 6 } }, now)).toContain(line);
    expect(bookingText(a, now)).not.toContain("pacote");
    const rem = reminderText({ ...a, session: { n: 3, total: 6 } }, now);
    // a linha vem antes das opções 1/2/3
    expect(rem.indexOf(line)).toBeGreaterThan(0);
    expect(rem.indexOf(line)).toBeLessThan(rem.indexOf("1 - Confirmo"));
    expect(secondReminderText({ ...a, session: { n: 3, total: 6 } }, now, {}, true)).toContain(line);
  });
});
