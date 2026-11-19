import { describe, expect, it } from "vitest";
import {
  appointmentPaid,
  cancelOutcome,
  cashIn,
  DEFAULT_POLICY,
  type Move,
  packageExpiresOn,
  parsePolicy,
  payXPrice,
  remainingCents,
  sessionValue,
  suggestedDeposit,
  walletBalance,
  walletStatement,
  packagePreview,
  packageSessionsLeft,
  parsePackageDraft,
} from "@/features/wallet/rules";

const A = "appt-a";
const m = (kind: Move["kind"], amountCents: number, appointmentId: string | null = A): Move => ({
  kind,
  amountCents,
  appointmentId,
});

describe("saldos da carteira", () => {
  it("sinal pago conta no atendimento e no caixa, não no crédito", () => {
    const moves = [m("payment", 3000)];
    expect(appointmentPaid(moves, A)).toBe(3000);
    expect(remainingCents(10000, appointmentPaid(moves, A))).toBe(7000);
    expect(walletBalance(moves)).toBe(0);
    expect(cashIn(moves)).toBe(3000);
  });
  it("anulação (mesmo tipo, valor negativo) desfaz o pagamento", () => {
    const moves = [m("payment", 3000), m("payment", -3000)];
    expect(appointmentPaid(moves, A)).toBe(0);
    expect(cashIn(moves)).toBe(0);
  });
  it("cancelado: o pago passa ao crédito e é usado em outro atendimento", () => {
    const moves = [m("payment", 3000), m("credit_in", 3000), m("credit_use", 2000, "appt-b")];
    expect(appointmentPaid(moves, A)).toBe(0);
    expect(appointmentPaid(moves, "appt-b")).toBe(2000);
    expect(walletBalance(moves)).toBe(1000);
    expect(cashIn(moves)).toBe(3000);
  });
  it("devolução sai do caixa; retido fica para o salão", () => {
    const moves = [m("payment", 10000), m("retained", 3000), m("credit_in", 7000), m("refund", 7000, null)];
    expect(appointmentPaid(moves, A)).toBe(0);
    expect(walletBalance(moves)).toBe(0);
    expect(cashIn(moves)).toBe(3000);
  });
  it("pagamento sem atendimento entra no crédito; vencimento tira", () => {
    expect(walletBalance([m("payment", 20000, null), m("expire", 5000, null)])).toBe(15000);
  });
  it("falta nunca é negativa", () => {
    expect(remainingCents(5000, 8000)).toBe(0);
  });
});

describe("sinal sugerido", () => {
  it("arredonda para reais inteiros, mínimo R$ 1 e no máximo o total", () => {
    expect(suggestedDeposit(9900, 30)).toBe(3000);
    expect(suggestedDeposit(10000, 30)).toBe(3000);
    expect(suggestedDeposit(250, 10)).toBe(100);
    expect(suggestedDeposit(50, 30)).toBe(50);
    expect(suggestedDeposit(12000, 100)).toBe(12000);
    expect(suggestedDeposit(0, 30)).toBe(0);
  });
});

describe("cancelar ou faltar com valor pago", () => {
  const startsAt = new Date("2030-05-10T15:00:00Z");
  const hoursBefore = (h: number) => new Date(startsAt.getTime() - h * 3_600_000);
  const base = { policy: DEFAULT_POLICY, startsAt, totalCents: 10000 };

  it("com antecedência: tudo vira crédito e a sessão volta", () => {
    expect(cancelOutcome({ ...base, status: "cancelled", at: hoursBefore(30), paidCents: 3000 })).toEqual({
      toCredit: 3000,
      retained: 0,
      sessionBack: true,
      late: false,
    });
  });
  it("em cima da hora: o sinal fica, o resto vira crédito", () => {
    expect(cancelOutcome({ ...base, status: "cancelled", at: hoursBefore(5), paidCents: 10000 })).toMatchObject({
      toCredit: 7000,
      retained: 3000,
      late: true,
    });
    expect(cancelOutcome({ ...base, status: "cancelled", at: hoursBefore(5), paidCents: 2000 })).toMatchObject({
      toCredit: 0,
      retained: 2000,
    });
  });
  it("em cima da hora com a política desligada: tudo vira crédito", () => {
    const policy = { ...DEFAULT_POLICY, lateCancelKeepsDeposit: false };
    expect(cancelOutcome({ ...base, policy, status: "cancelled", at: hoursBefore(1), paidCents: 3000 })).toMatchObject({
      toCredit: 3000,
      retained: 0,
    });
  });
  it("faltou: sinal fica e a sessão é consumida (padrão); dá para devolver a sessão", () => {
    expect(cancelOutcome({ ...base, status: "no_show", at: startsAt, paidCents: 3000 })).toMatchObject({
      retained: 3000,
      toCredit: 0,
      sessionBack: false,
    });
    const policy = { ...DEFAULT_POLICY, noShowUsesSession: false, noShowKeepsDeposit: false };
    expect(cancelOutcome({ ...base, policy, status: "no_show", at: startsAt, paidCents: 3000 })).toMatchObject({
      retained: 0,
      toCredit: 3000,
      sessionBack: true,
    });
  });
  it("sem nada pago, nada muda", () => {
    expect(cancelOutcome({ ...base, status: "no_show", at: startsAt, paidCents: 0 })).toMatchObject({
      retained: 0,
      toCredit: 0,
    });
  });
});

describe("pacotes", () => {
  it("pague 3, leve 4: preço é 3 vezes o serviço", () => {
    expect(payXPrice(3, 4500)).toBe(13500);
  });
  it("valor por sessão soma o preço do pacote", () => {
    expect([0, 1, 2, 3].map((i) => sessionValue(13500, 4, i))).toEqual([3375, 3375, 3375, 3375]);
    const three = [0, 1, 2].map((i) => sessionValue(10000, 3, i));
    expect(three).toEqual([3333, 3333, 3334]);
    expect(three.reduce((a, b) => a + b)).toBe(10000);
  });
  it("validade conta dias corridos, virando mês e ano", () => {
    expect(packageExpiresOn("2026-11-19", 90)).toBe("2027-02-17");
    expect(packageExpiresOn("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("formulário de Ajustes > Pagamentos", () => {
  const good = {
    depositPct: "30",
    cancelNoticeHours: "24",
    packageValidDays: "90",
    pixKey: "  salao@pix.com ",
    lateCancelKeepsDeposit: "on",
  };
  it("lê os valores e as chaves ligadas", () => {
    const r = parsePolicy(good);
    expect(r).toMatchObject({
      ok: true,
      pixKey: "salao@pix.com",
      policy: { depositPct: 30, cancelNoticeHours: 24, lateCancelKeepsDeposit: true, noShowKeepsDeposit: false },
    });
  });
  it("Pix vazio vira null", () => {
    expect(parsePolicy({ ...good, pixKey: "  " })).toMatchObject({ ok: true, pixKey: null });
  });
  it("aponta o campo fora da faixa", () => {
    expect(parsePolicy({ ...good, depositPct: "0" })).toEqual({ ok: false, field: "depositPct" });
    expect(parsePolicy({ ...good, cancelNoticeHours: "200" })).toEqual({ ok: false, field: "cancelNoticeHours" });
    expect(parsePolicy({ ...good, packageValidDays: "abc" })).toEqual({ ok: false, field: "packageValidDays" });
    expect(parsePolicy({ ...good, pixKey: "x".repeat(141) })).toEqual({ ok: false, field: "pixKey" });
  });
});

describe("extrato do crédito na ficha", () => {
  it("mostra só o que mexe no crédito, o mais novo primeiro, com o sinal do efeito", () => {
    const t = (d: number) => new Date(2030, 0, d);
    const rows = [
      { ...m("payment", 5000), reason: null, occurredAt: t(1) },
      { ...m("credit_in", 5000), reason: "Cancelou", occurredAt: t(2) },
      { ...m("credit_use", 3000, "outro"), reason: null, occurredAt: t(3) },
      { ...m("refund", 2000, null), reason: null, occurredAt: t(4) },
    ];
    expect(walletStatement(rows)).toEqual([
      { at: t(4), label: "Devolvido", cents: -2000 },
      { at: t(3), label: "Usado no agendamento", cents: -3000 },
      { at: t(2), label: "Cancelou", cents: 5000 },
    ]);
  });
});

describe("pacotes", () => {
  const brl = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
  it("prévia do Pague 3 leve 4 com a economia e a validade", () => {
    expect(
      packagePreview(
        { kind: "pay_x", sessionsPaid: 3, sessionsTotal: 4, priceCents: 0 },
        { name: "Esmaltação", priceCents: 4500 },
        90,
        brl,
      ),
    ).toBe(
      "Paga 3 e leva 4: cliente paga R$ 135,00 e ganha 4 sessões de Esmaltação (economiza R$ 45,00). Vale 90 dias.",
    );
  });
  it("sessões que restam: vendidas − usadas + devolvidas (anulação entra com sinal trocado)", () => {
    const p = "pk";
    const mv = (kind: Move["kind"], sessions: number): Move => ({
      kind,
      amountCents: 0,
      appointmentId: null,
      clientPackageId: p,
      sessions,
    });
    expect(
      packageSessionsLeft(
        [mv("session_grant", 4), mv("session_reserve", 1), mv("session_return", 1), mv("session_return", -1)],
        p,
      ),
    ).toBe(3);
  });
  it("formulário: paga menos do que leva; pacote de sessões pede preço", () => {
    const base = { name: "X", serviceId: "00000000-0000-4000-8000-000000000000", sessionsTotal: "4" };
    expect(parsePackageDraft({ ...base, kind: "pay_x", sessionsPaid: "4" })).toEqual({
      ok: false,
      field: "sessionsPaid",
    });
    expect(parsePackageDraft({ ...base, kind: "sessions", priceCents: null })).toEqual({
      ok: false,
      field: "priceCents",
    });
    expect(parsePackageDraft({ ...base, kind: "sessions", priceCents: 40000 })).toMatchObject({ ok: true });
  });
});
