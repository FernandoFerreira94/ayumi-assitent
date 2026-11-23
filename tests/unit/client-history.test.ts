import { describe, expect, it } from "vitest";
import {
  attendanceRate,
  decodeCursor,
  encodeCursor,
  mergePage,
  moneyLabel,
  statusTone,
  visitPaymentLine,
} from "@/features/clients/history-rules";

const brl = (c: number) => `R$${c / 100}`;
const at = (iso: string, id: string) => ({ at: new Date(iso), id });
const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const C = "00000000-0000-0000-0000-00000000000c";

describe("histórico da cliente: regras", () => {
  it("cursor vai e volta; lixo vira null", () => {
    const c = at("2026-10-01T12:00:00.000Z", A);
    expect(decodeCursor(encodeCursor(c))).toEqual(c);
    expect(decodeCursor("x|y")).toBeNull();
    expect(decodeCursor("nada")).toBeNull();
    expect(decodeCursor(null)).toBeNull();
  });

  it("junta listas, mais novo primeiro, desempata por id e corta a página", () => {
    const p = mergePage(
      [
        [at("2026-10-03T00:00:00Z", A), at("2026-10-01T00:00:00Z", A)],
        [at("2026-10-03T00:00:00Z", B), at("2026-10-02T00:00:00Z", C)],
      ],
      3,
    );
    expect(p.items.map((i) => i.id)).toEqual([B, A, C]);
    expect(p.next).toBe(encodeCursor(at("2026-10-02T00:00:00Z", C)));
    expect(mergePage([[at("2026-10-01T00:00:00Z", A)]], 3).next).toBeNull();
  });

  it("pagamento do atendimento", () => {
    expect(visitPaymentLine("done", 5000, 5000, brl)).toEqual({ text: "Pago", tone: "ok" });
    expect(visitPaymentLine("confirmed", 5000, 1500, brl)?.text).toBe("Sinal R$15 · falta R$35");
    expect(visitPaymentLine("confirmed", 5000, 0, brl)?.text).toBe("A pagar R$50");
    expect(visitPaymentLine("no_show", 5000, 1500, brl)).toBeNull();
    expect(visitPaymentLine("cancelled", 5000, 0, brl)).toBeNull();
  });

  it("nome do movimento", () => {
    const m = { amountCents: 2000, appointmentPriceCents: 5000, packageName: null, reason: null };
    expect(moneyLabel({ ...m, kind: "payment" })).toBe("Sinal");
    expect(moneyLabel({ ...m, kind: "payment", amountCents: 5000 })).toBe("Pagamento");
    expect(moneyLabel({ ...m, kind: "payment", reason: "Recebido ao concluir" })).toBe("Recebido ao concluir");
    expect(moneyLabel({ ...m, kind: "payment", appointmentPriceCents: null })).toBe("Crédito lançado");
    expect(moneyLabel({ ...m, kind: "payment", packageName: "Verão" })).toBe("Pagou o pacote Verão");
    expect(moneyLabel({ ...m, kind: "retained" })).toBe("Sinal ficou para o salão");
  });

  it("cor do status e comparecimento", () => {
    expect(statusTone("done", false)).toBe("ok");
    expect(statusTone("no_show", false)).toBe("fail");
    expect(statusTone("confirmed", true)).toBe("info");
    expect(attendanceRate(9, 1)).toBe(90);
    expect(attendanceRate(0, 0)).toBeNull();
  });
});
