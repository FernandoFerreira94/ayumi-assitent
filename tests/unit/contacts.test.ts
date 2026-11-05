import { describe, expect, it } from "vitest";
import { GoogleAuthError } from "@/features/google/calendar";
import { fetchGoogleContacts } from "@/features/contacts/google";
import { parseContactsFile, parseCsv, parseVcf } from "@/features/contacts/parse";

const VCF = `BEGIN:VCARD
VERSION:3.0
N:Silva;Maria;;;
FN:Maria Silva
TEL;TYPE=CELL:(11) 98765-4321
TEL;TYPE=HOME:+55 11 3456-7890
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Sem Telefone
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Maria Repetida
TEL:11987654321
END:VCARD
BEGIN:VCARD
VERSION:3.0
N:Souza;Ana;;;
item1.TEL:11 91111-2222
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Curto
TEL:123
END:VCARD`;

describe("contatos: vcf", () => {
  const r = parseVcf(VCF);
  it("lê vários telefones, tira repetidos e usa N quando falta FN", () => {
    expect(r.candidates).toEqual([
      { name: "Maria Silva", phone: "+5511987654321" },
      { name: "Maria Silva", phone: "+551134567890" },
      { name: "Ana Souza", phone: "+5511911112222" },
    ]);
  });
  it("conta ignorados (sem telefone ou inválido)", () => expect(r.ignored).toBe(2));
  it("detecta vcf pelo conteúdo", () => {
    expect(parseContactsFile("contatos.txt", VCF).candidates).toHaveLength(3);
  });
});

describe("contatos: csv", () => {
  it("formato simples com ponto e vírgula e aspas", () => {
    const r = parseCsv('﻿Nome;Telefone\r\n"Souza; Ana";(11) 91111-2222\r\nBia;11 92222-3333\r\n;11 93333-4444');
    expect(r.candidates).toEqual([
      { name: "Souza; Ana", phone: "+5511911112222" },
      { name: "Bia", phone: "+5511922223333" },
    ]);
    expect(r.ignored).toBe(1);
  });
  it("formato Google (nome + vários telefones)", () => {
    const r = parseCsv(
      "First Name,Last Name,Phone 1 - Type,Phone 1 - Value\nJoana,Lima,Mobile,11 94444-5555 ::: 11 3333-4444",
    );
    expect(r.candidates.map((c) => c.phone)).toEqual(["+5511944445555", "+551133334444"]);
    expect(r.candidates[0].name).toBe("Joana Lima");
  });
  it("sem linhas de dados", () => expect(parseCsv("Nome,Telefone").candidates).toEqual([]));
});

describe("contatos: Google People", () => {
  const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  it("pagina e normaliza", async () => {
    const calls: string[] = [];
    const f = (async (u: URL) => {
      calls.push(u.toString());
      return u.searchParams.get("pageToken")
        ? res(200, {
            connections: [{ names: [{ displayName: "Bia Lopes" }], phoneNumbers: [{ value: "11 92222-3333" }] }],
          })
        : res(200, {
            connections: [
              { names: [{ displayName: "Ana" }], phoneNumbers: [{ value: "(11) 91111-2222" }] },
              { names: [{ displayName: "Nada" }] },
            ],
            nextPageToken: "p2",
          });
    }) as unknown as typeof fetch;
    const r = await fetchGoogleContacts("tok", f);
    expect(calls).toHaveLength(2);
    expect(r.candidates.map((c) => c.name)).toEqual(["Ana", "Bia Lopes"]);
    expect(r.ignored).toBe(1);
  });
  it("403 vira erro de autorização", async () => {
    const f = (async () => res(403, {})) as unknown as typeof fetch;
    await expect(fetchGoogleContacts("tok", f)).rejects.toBeInstanceOf(GoogleAuthError);
  });
});
