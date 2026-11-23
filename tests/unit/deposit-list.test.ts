import { describe, expect, it } from "vitest";
import { paymentView } from "@/features/appointments/payment";
import {
  byDay,
  dayHeading,
  depositGroup,
  fold,
  inPeriod,
  periodEnd,
  summarize,
  type DepositItem,
} from "@/features/appointments/deposit-list";

const now = new Date("2026-11-23T12:00:00-03:00");
const at = (s: string) => new Date(`${s}-03:00`);

function item(
  id: string,
  when: string,
  pay: { paidCents?: number; requested?: number; paidAt?: Date; status?: string } = {},
  clientName = "Ana",
): DepositItem {
  const startsAt = at(when);
  return {
    id,
    startsAt,
    clientName,
    serviceName: "Unha",
    payment: paymentView({
      paidAt: pay.paidAt ?? null,
      startsAt,
      status: pay.status ?? "confirmed",
      paymentMethod: null,
      priceCents: 10000,
      paidCents: pay.paidCents ?? 0,
      depositRequestedCents: pay.requested ?? null,
    }),
  };
}

describe("depositGroup", () => {
  it("separa sinal pago, pedido, sem sinal e pago", () => {
    expect(depositGroup(item("a", "2026-11-23T14:00:00", { paidCents: 3000 }).payment)).toBe("deposit");
    expect(depositGroup(item("b", "2026-11-23T14:00:00", { requested: 3000 }).payment)).toBe("requested");
    expect(depositGroup(item("c", "2026-11-23T14:00:00").payment)).toBe("none");
    expect(depositGroup(item("d", "2026-11-23T14:00:00", { paidCents: 10000 }).payment)).toBe("paid");
    expect(depositGroup(item("e", "2026-11-23T14:00:00", { status: "done" }).payment)).toBe("paid");
  });

  it("pedido que já entrou vira sinal pago", () => {
    expect(depositGroup(item("a", "2026-11-23T14:00:00", { requested: 3000, paidCents: 3000 }).payment)).toBe(
      "deposit",
    );
  });
});

describe("summarize", () => {
  it("soma o sinal que entrou, o que falta do pedido e o que falta de quem não deu sinal", () => {
    const s = summarize([
      item("a", "2026-11-23T14:00:00", { paidCents: 3000 }),
      item("b", "2026-11-24T14:00:00", { requested: 4000 }),
      item("c", "2026-11-25T14:00:00"),
      item("d", "2026-11-25T15:00:00", { paidCents: 10000 }),
    ]);
    expect(s.deposit).toEqual({ count: 1, cents: 3000 });
    expect(s.requested).toEqual({ count: 1, cents: 4000 });
    expect(s.none).toEqual({ count: 1, cents: 10000 });
    expect(s.paid).toEqual({ count: 1, cents: 10000 });
  });
});

describe("inPeriod", () => {
  const list = [
    item("hoje", "2026-11-23T23:30:00", {}, "Júlia Souza"),
    item("sab", "2026-11-29T10:00:00", {}, "Bia"),
    item("dom", "2026-11-30T10:00:00", {}, "Carla"),
  ];

  it("hoje = só o dia, no fuso do estúdio", () => {
    expect(inPeriod(list, "hoje", "", now).map((x) => x.id)).toEqual(["hoje"]);
  });

  it("7 dias = hoje + 6", () => {
    expect(periodEnd("semana", "2026-11-23")).toBe("2026-11-29");
    expect(inPeriod(list, "semana", "", now).map((x) => x.id)).toEqual(["hoje", "sab"]);
  });

  it("próximos = tudo o que veio", () => {
    expect(inPeriod(list, "proximos", "", now)).toHaveLength(3);
  });

  it("busca sem acento e sem maiúscula", () => {
    expect(fold("  Júlia ")).toBe("julia");
    expect(inPeriod(list, "proximos", "julia", now).map((x) => x.id)).toEqual(["hoje"]);
  });
});

describe("byDay e dayHeading", () => {
  it("junta por dia na ordem", () => {
    const d = byDay([
      item("a", "2026-11-23T09:00:00"),
      item("b", "2026-11-23T10:00:00"),
      item("c", "2026-11-25T10:00:00"),
    ]);
    expect(d.map((x) => [x.date, x.items.length])).toEqual([
      ["2026-11-23", 2],
      ["2026-11-25", 1],
    ]);
  });

  it("Hoje, Amanhã e dia da semana", () => {
    expect(dayHeading("2026-11-23", now)).toBe("Hoje");
    expect(dayHeading("2026-11-24", now)).toBe("Amanhã");
    expect(dayHeading("2026-11-25", now)).toBe("Quarta, 25/11");
  });
});
