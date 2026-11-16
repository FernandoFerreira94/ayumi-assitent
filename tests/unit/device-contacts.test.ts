import { describe, expect, it } from "vitest";
import { contactName, flattenContacts, MAX_DEVICE_ROWS } from "@/features/native/device-contacts-core";
import { normalize } from "@/features/contacts/parse";
import { deviceInput } from "@/features/contacts/schema";

describe("agenda do celular → import de clientes", () => {
  it("monta o nome pelo display ou pelas partes", () => {
    expect(contactName({ display: " Maria Souza " })).toBe("Maria Souza");
    expect(contactName({ display: null, given: "Ana", middle: null, family: "Lima" })).toBe("Ana Lima");
    expect(contactName(null)).toBe("");
  });

  it("um telefone por linha, primeiro e-mail, sem telefone fica de fora", () => {
    const rows = flattenContacts([
      {
        name: { display: "Bia" },
        phones: [{ number: "(11) 98765-4321" }, { number: " " }, { number: "+55 21 99999-0000" }],
        emails: [{ address: "" }, { address: "bia@x.com" }],
      },
      { name: { display: "Sem telefone" }, phones: [] },
      { name: { given: "Cris" }, phones: null },
    ]);
    expect(rows).toEqual([
      { name: "Bia", phone: "(11) 98765-4321", email: "bia@x.com" },
      { name: "Bia", phone: "+55 21 99999-0000", email: "bia@x.com" },
    ]);
  });

  it("para no limite de linhas", () => {
    const many = Array.from({ length: MAX_DEVICE_ROWS + 10 }, (_, i) => ({
      name: { display: `P${i}` },
      phones: [{ number: `11 9${String(i).padStart(8, "0")}` }],
    }));
    expect(flattenContacts(many)).toHaveLength(MAX_DEVICE_ROWS);
  });

  it("o servidor valida e normaliza como o arquivo (DDD, duplicados, sem nome)", () => {
    const p = deviceInput.safeParse([
      { name: "Bia", phone: "(11) 98765-4321" },
      { name: "Bia de novo", phone: "+55 11 98765-4321" },
      { name: "", phone: "11 91234-5678" },
      { name: "Sem DDD", phone: "98765-4321" },
    ]);
    expect(p.success).toBe(true);
    const r = normalize(p.data!);
    expect(r.candidates).toEqual([{ name: "Bia", phone: "+5511987654321" }]);
    expect(r.ignored).toBe(2);
    expect(deviceInput.safeParse([{ name: "x".repeat(201), phone: "1" }]).success).toBe(false);
  });
});
