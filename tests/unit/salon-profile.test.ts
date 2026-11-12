import { describe, expect, it } from "vitest";
import { phoneFromWhatsapp, salonInput } from "@/features/salon/schema";

describe("phoneFromWhatsapp", () => {
  it("normaliza o número do WhatsApp e devolve o 9 do celular", () => {
    expect(phoneFromWhatsapp("+5511987654321")).toBe("+5511987654321");
    expect(phoneFromWhatsapp("+551187654321")).toBe("+5511987654321");
    expect(phoneFromWhatsapp("+551134567890")).toBe("+551134567890");
  });
  it("ignora vazio ou número de fora", () => {
    expect(phoneFromWhatsapp(null)).toBeNull();
    expect(phoneFromWhatsapp("+14155550100")).toBeNull();
  });
});

describe("salonInput", () => {
  const base = { name: "Studio", ownerName: "", businessPhone: "" };
  it("exige ao menos um segmento", () => {
    expect(salonInput.safeParse({ ...base, segments: [] }).success).toBe(false);
    expect(salonInput.safeParse({ ...base, segments: ["nail_designer", "lash_designer"] }).success).toBe(true);
  });
  it("telefone comercial é opcional e sai em E.164", () => {
    const seg = { segments: ["nail_designer"] };
    expect(salonInput.parse({ ...base, ...seg }).businessPhone).toBeNull();
    expect(salonInput.parse({ ...base, ...seg, businessPhone: "(11) 98765-4321" }).businessPhone).toBe("+5511987654321");
    expect(salonInput.safeParse({ ...base, ...seg, businessPhone: "9876" }).success).toBe(false);
  });
});
