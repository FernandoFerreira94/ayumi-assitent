import { describe, expect, it } from "vitest";
import { parsePayment, paymentLabel, paymentState, paymentView } from "@/features/appointments/payment";
import { splitPayments } from "@/features/finance/payments";
import { formatBRL } from "@/lib/dates";

const start = new Date("2030-03-10T15:00:00Z");
const before = new Date("2030-03-09T12:00:00Z");
const after = new Date("2030-03-10T16:00:00Z");

describe("estado do pagamento", () => {
  it("pago antes do começo é adiantado; no dia ou depois é pago", () => {
    expect(paymentState({ paidAt: before, startsAt: start, status: "confirmed" })).toBe("advance");
    expect(paymentState({ paidAt: after, startsAt: start, status: "done" })).toBe("paid");
  });
  it("sem marcação: concluído conta como pago no atendimento; em aberto fica a pagar", () => {
    expect(paymentState({ paidAt: null, startsAt: start, status: "done" })).toBe("on_service");
    expect(paymentState({ paidAt: null, startsAt: start, status: "pending_confirmation" })).toBe("unpaid");
  });
  it("selo leva a forma só quando foi marcado", () => {
    expect(paymentLabel("advance", "pix")).toBe("Pago adiantado · Pix");
    expect(paymentLabel("unpaid", "pix")).toBe("A pagar");
    expect(paymentView({ paidAt: after, startsAt: start, status: "done", paymentMethod: null }).label).toBe("Pago");
  });
});

describe("pagamento na folha de agendar", () => {
  it("só marca com paid=1; forma desconhecida vira sem forma", () => {
    expect(parsePayment("", "pix")).toBeNull();
    expect(parsePayment(null, null)).toBeNull();
    expect(parsePayment("1", "pix")).toEqual({ method: "pix" });
    expect(parsePayment("1", "boleto")).toEqual({ method: null });
  });
  it("sinal lê o valor em reais; vazio ou inválido não passa", () => {
    expect(parsePayment("deposit", "pix", "30,00")).toEqual({ method: "pix", amountCents: 3000 });
    expect(parsePayment("deposit", null, "1.250,5")).toEqual({ method: null, amountCents: 125050 });
    expect(parsePayment("deposit", null, "")).toBe("invalid");
    expect(parsePayment("deposit", null, "abc")).toBe("invalid");
  });
});

describe("sinal no selo", () => {
  it("parte paga em aberto vira sinal com o que falta", () => {
    const v = paymentView({
      paidAt: null,
      startsAt: start,
      status: "confirmed",
      paymentMethod: "pix",
      priceCents: 10000,
      paidCents: 3000,
    });
    expect(v).toMatchObject({ state: "deposit", paidCents: 3000, remainingCents: 7000 });
    expect(v.label.replace(/\s/g, " ")).toBe("Sinal R$ 30,00 · falta R$ 70,00");
  });
  it("concluído com sinal conta como pago no atendimento", () => {
    expect(paymentState({ paidAt: null, startsAt: start, status: "done", paidCents: 3000, priceCents: 10000 })).toBe(
      "on_service",
    );
  });
  it("sem nada pago fica a pagar, com o total faltando", () => {
    expect(
      paymentView({
        paidAt: null,
        startsAt: start,
        status: "confirmed",
        paymentMethod: null,
        priceCents: 5000,
        paidCents: 0,
      }),
    ).toMatchObject({ state: "unpaid", remainingCents: 5000 });
  });
});

describe("pagamentos do mês no Financeiro", () => {
  const row = (id: string, status: string, paidAt: Date | null, priceCents = 5000) => ({
    id,
    startsAt: start,
    status,
    priceCents,
    clientName: "Ana",
    serviceName: "Unha",
    paidAt,
    paymentMethod: null,
  });
  it("separa a pagar e adiantado, sem falta nem concluído sem marcação", () => {
    const r = splitPayments([
      row("a", "confirmed", null, 3000),
      row("b", "pending_confirmation", before, 7000),
      row("c", "done", null),
      row("d", "no_show", null),
      row("e", "done", after),
    ]);
    expect(r.toPay.map((x) => x.id)).toEqual(["a"]);
    expect(r.advance.map((x) => x.id)).toEqual(["b"]);
    expect(r).toMatchObject({ toPayCents: 3000, advanceCents: 7000 });
  });
  it("quem deu sinal aparece nas duas abas: o que falta e o que pagou", () => {
    const r = splitPayments([{ ...row("s", "confirmed", null, 10000), paidCents: 3000 }]);
    expect(r.toPay.map((x) => x.id)).toEqual(["s"]);
    expect(r.advance.map((x) => x.id)).toEqual(["s"]);
    expect(r).toMatchObject({ toPayCents: 7000, advanceCents: 3000 });
  });
});

describe("sinal pedido à cliente", () => {
  it("lê 'request' da folha de agendar como pedido, não pagamento", () => {
    expect(parsePayment("request", "pix", "30,00")).toEqual({ requestCents: 3000 });
    expect(parsePayment("request", null, "abc")).toBe("invalid");
  });
  it("fica 'Sinal pedido' até entrar o valor pedido; depois vira sinal", () => {
    const base = { paidAt: null, startsAt: start, status: "pending_confirmation", priceCents: 10000 };
    expect(paymentState({ ...base, depositRequestedCents: 3000 })).toBe("deposit_requested");
    expect(paymentState({ ...base, depositRequestedCents: 3000, paidCents: 3000 })).toBe("deposit");
    expect(paymentState({ ...base, depositRequestedCents: 3000, paidCents: 10000 })).toBe("paid");
    expect(paymentState({ ...base, status: "done", depositRequestedCents: 3000 })).toBe("on_service");
    const v = paymentView({ ...base, paymentMethod: null, depositRequestedCents: 3000 });
    expect(v.label).toBe(`Sinal pedido ${formatBRL(3000)}`);
    expect(v.requestedCents).toBe(3000);
  });
  it("no Financeiro, sinal pedido fica em 'A pagar' e não em 'Adiantado'", () => {
    const r = splitPayments([
      {
        id: "a",
        startsAt: start,
        status: "pending_confirmation",
        priceCents: 10000,
        clientName: "Ana",
        serviceName: "Gel",
        paidAt: null,
        paymentMethod: null,
        depositRequestedCents: 3000,
      },
    ]);
    expect(r.toPayCents).toBe(10000);
    expect(r.advance).toHaveLength(0);
  });
});
