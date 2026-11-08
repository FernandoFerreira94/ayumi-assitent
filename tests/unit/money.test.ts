import { describe, expect, it } from "vitest";
import { maskMoney } from "@/lib/money";
import { serviceInput } from "@/features/services/schema";

describe("maskMoney", () => {
  it("enche da direita: os dois últimos dígitos são centavos", () => {
    expect(maskMoney("1")).toBe("0,01");
    expect(maskMoney("15")).toBe("0,15");
    expect(maskMoney("150")).toBe("1,50");
    expect(maskMoney("15000")).toBe("150,00");
  });
  it("separa milhar com ponto", () => expect(maskMoney("123456")).toBe("1.234,56"));
  it("ignora zeros à esquerda e letras", () => expect(maskMoney("R$ 0012,5x0")).toBe("12,50"));
  it("vazio continua vazio para o placeholder aparecer", () => expect(maskMoney("")).toBe(""));
  it("corta acima do limite do serviço", () => expect(maskMoney("12345678901")).toBe("99.999,99"));
  it("o valor mascarado passa no schema em centavos", () => {
    const r = serviceInput.parse({ name: "Corte", durationMin: "60", price: maskMoney("123456") });
    expect(r.price).toBe(123456);
  });
});
