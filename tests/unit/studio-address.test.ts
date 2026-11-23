import { describe, expect, it } from "vitest";
import { addressInput, formatAddress, fromBrasilApi, fromViaCep, mapsUrl, maskCep } from "@/features/salon/address";

describe("endereço do estúdio", () => {
  it("máscara do CEP enquanto digita", () => {
    expect(maskCep("12245")).toBe("12245");
    expect(maskCep("12245000")).toBe("12245-000");
    expect(maskCep("12.245-000999")).toBe("12245-000");
  });
  it("monta a linha pronta, com e sem complemento", () => {
    const a = {
      cep: "12245000",
      street: "Rua Anna",
      number: "430",
      complement: "",
      district: "Centro",
      city: "São José dos Campos",
      state: "SP",
    };
    expect(formatAddress(a)).toBe("Rua Anna, 430 - Centro, São José dos Campos - SP, 12245-000");
    expect(formatAddress({ ...a, complement: "Sala 2" })).toBe(
      "Rua Anna, 430, Sala 2 - Centro, São José dos Campos - SP, 12245-000",
    );
    expect(formatAddress({ ...a, street: "  " })).toBe("");
  });
  it("valida a entrada: CEP com 8 números, UF real, número obrigatório", () => {
    const ok = addressInput.safeParse({
      cep: "12245-000",
      street: "Rua Anna",
      number: "s/n",
      complement: "",
      district: "Centro",
      city: "SJC",
      state: "sp",
    });
    expect(ok.success && ok.data).toMatchObject({ cep: "12245000", state: "SP" });
    expect(addressInput.safeParse({ ...(ok.success ? ok.data : {}), cep: "1224" }).success).toBe(false);
    expect(addressInput.safeParse({ ...(ok.success ? ok.data : {}), state: "XX" }).success).toBe(false);
    expect(addressInput.safeParse({ ...(ok.success ? ok.data : {}), number: "" }).success).toBe(false);
  });
  it("lê a resposta do ViaCEP e recusa CEP inexistente", () => {
    expect(
      fromViaCep({
        cep: "12245-000",
        logradouro: "Rua A",
        bairro: "Centro",
        localidade: "São José dos Campos",
        uf: "SP",
      }),
    ).toEqual({ cep: "12245000", street: "Rua A", district: "Centro", city: "São José dos Campos", state: "SP" });
    expect(fromViaCep({ erro: true })).toBeNull();
    expect(fromViaCep({ erro: "true" })).toBeNull();
    expect(fromViaCep(null)).toBeNull();
  });
  it("link do mapa com o endereço codificado", () => {
    expect(mapsUrl("Rua A, 1")).toBe("https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%201");
  });
  it("lê a resposta da BrasilAPI (segunda fonte)", () => {
    expect(
      fromBrasilApi({
        cep: "12245000",
        street: "Rua A",
        neighborhood: "Centro",
        city: "São José dos Campos",
        state: "SP",
      }),
    ).toEqual({ cep: "12245000", street: "Rua A", district: "Centro", city: "São José dos Campos", state: "SP" });
    expect(fromBrasilApi({ message: "CEP não encontrado" })).toBeNull();
  });
});
