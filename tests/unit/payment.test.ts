import { describe, expect, it } from "vitest";
import { parsePayment, paymentLabel, paymentState, paymentView } from "@/features/appointments/payment";
import { splitPayments } from "@/features/finance/payments";

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
});
