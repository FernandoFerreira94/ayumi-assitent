import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isNavActive } from "@/components/nav/nav-items";

describe("isNavActive", () => {
  it.each([
    ["/agenda", "/agenda", true],
    ["/clientes/123", "/clientes", true],
    ["/clientes-antigos", "/clientes", false],
    ["/vagas", "/agenda", false],
  ])("%s em %s → %s", (pathname, href, expected) => {
    expect(isNavActive(pathname, href)).toBe(expected);
  });
});

describe("NAV_ITEMS", () => {
  it("tem as 8 telas na ordem das pranchas", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Painel",
      "Calendário",
      "Finanças",
      "Clientes",
      "Serviços",
      "Vagas",
      "Pendências",
      "Ajustes",
    ]);
    expect(NAV_ITEMS.filter((i) => i.group === "main")).toHaveLength(4);
  });
});
