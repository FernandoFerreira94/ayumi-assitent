import { describe, expect, it } from "vitest";
import { crc16, normalizePixKey, pixCopyPaste } from "@/features/wallet/pix-brcode";

describe("Pix copia e cola", () => {
  it("CRC16-CCITT bate com o valor de referência", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("reconhece os tipos de chave", () => {
    expect(normalizePixKey(" Salao@Pix.com ")).toBe("salao@pix.com");
    expect(normalizePixKey("(12) 99704-1551")).toBe("+5512997041551");
    expect(normalizePixKey("+55 12 99704-1551")).toBe("+5512997041551");
    expect(normalizePixKey("529.982.247-25")).toBe("52998224725");
    expect(normalizePixKey("52998224725")).toBe("52998224725");
    expect(normalizePixKey("11.222.333/0001-81")).toBe("11222333000181");
    expect(normalizePixKey("123E4567-E12B-12D1-A456-426655440000")).toBe("123e4567-e12b-12d1-a456-426655440000");
    expect(normalizePixKey("111.111.111-11")).toBeNull();
    expect(normalizePixKey("minha chave")).toBeNull();
    expect(normalizePixKey("")).toBeNull();
  });
  it("monta o código com chave, valor, nome e cidade, e o CRC no fim", () => {
    const code = pixCopyPaste({ key: "salao@pix.com", name: "Estúdio Ayumi & Cia", city: "São José dos Campos", cents: 3000 })!;
    expect(code.startsWith("000201")).toBe(true);
    expect(code).toContain("0014br.gov.bcb.pix0113salao@pix.com");
    expect(code).toContain("540530.00");
    expect(code).toContain("5802BR5917ESTUDIO AYUMI CIA");
    expect(code).toContain("6015SAO JOSE DOS CA");
    expect(code).toContain("62070503***6304");
    expect(code.slice(-4)).toBe(crc16(code.slice(0, -4)));
  });
  it("sem chave reconhecida, sem nome ou sem valor: não monta", () => {
    expect(pixCopyPaste({ key: "x", name: "Salão", cents: 3000 })).toBeNull();
    expect(pixCopyPaste({ key: "salao@pix.com", name: "", cents: 3000 })).toBeNull();
    expect(pixCopyPaste({ key: "salao@pix.com", name: "Salão", cents: 0 })).toBeNull();
    expect(pixCopyPaste({ key: "salao@pix.com", name: "Salão", cents: 100 })).toContain("6006BRASIL");
  });
});
