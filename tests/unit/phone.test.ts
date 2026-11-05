import { describe, expect, it } from "vitest";
import { maskPhone, toE164 } from "@/lib/phone";

describe("maskPhone", () => {
  it("formata celular de 11 dígitos", () => expect(maskPhone("11987650000")).toBe("(11) 98765-0000"));
  it("formata fixo de 10 dígitos", () => expect(maskPhone("1134567890")).toBe("(11) 3456-7890"));
  it("aceita digitação parcial", () => {
    expect(maskPhone("1")).toBe("(1");
    expect(maskPhone("119")).toBe("(11) 9");
    expect(maskPhone("")).toBe("");
  });
  it("ignora letras e corta o excesso", () => expect(maskPhone("(11) 98765-0000999")).toBe("(11) 98765-0000"));
});

describe("toE164", () => {
  it("converte para +55", () => expect(toE164("(11) 98765-0000")).toBe("+5511987650000"));
  it("não duplica o 55", () => expect(toE164("+55 11 98765-0000")).toBe("+5511987650000"));
  it("recusa número incompleto", () => expect(toE164("(11) 9876")).toBeNull());
});
