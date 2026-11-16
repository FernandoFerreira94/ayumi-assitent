import { describe, expect, it } from "vitest";
import { toCsv } from "@/features/admin/csv";

describe("toCsv", () => {
  it("BOM, ponto e vírgula e CRLF", () => {
    expect(toCsv(["A", "B"], [["x", 1]])).toBe("﻿A;B\r\nx;1\r\n");
  });

  it("aspas quando tem separador, aspas ou quebra; null vira vazio", () => {
    expect(toCsv(["A"], [['a;b'], ['diz "oi"'], ["1,5"], [null]])).toBe('﻿A\r\n"a;b"\r\n"diz ""oi"""\r\n"1,5"\r\n\r\n');
  });

  it("neutraliza fórmula (= + - @)", () => {
    const out = toCsv(["A"], [["=HYPERLINK(1)"], ["+1"], ["-1"], ["@x"]]);
    expect(out).toContain("'=HYPERLINK(1)");
    expect(out).toContain("'+1");
    expect(out).toContain("'-1");
    expect(out).toContain("'@x");
  });
});
