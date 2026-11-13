import { describe, expect, it } from "vitest";
import { toCsv } from "@/features/salon/export-csv";

describe("toCsv", () => {
  it("cabeçalho, BOM e escape de ; aspas e quebra de linha", () => {
    const csv = toCsv([
      { nome: 'Ana; "Bia"', telefone: "+5511999990000", obs: null },
      { nome: "Cris", telefone: "+5511888880000", obs: "linha1\nlinha2" },
    ]);
    expect(csv.startsWith("﻿nome;telefone;obs\r\n")).toBe(true);
    expect(csv).toContain('"Ana; ""Bia""";+5511999990000;');
    expect(csv).toContain('Cris;+5511888880000;"linha1\nlinha2"');
  });
  it("lista vazia vira só o BOM", () => {
    expect(toCsv([])).toBe("﻿");
  });
});
