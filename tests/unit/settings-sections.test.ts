import { describe, expect, it } from "vitest";
import { hoursSummary, legacyTarget, SECTIONS } from "@/features/settings/sections";

const open = { opens: "09:00", closes: "18:00" };

describe("seções de Ajustes", () => {
  it("âncoras da página antiga levam à seção nova", () => {
    expect(legacyTarget("#whatsapp")).toBe("/ajustes/whatsapp#whatsapp");
    expect(legacyTarget("#google")).toBe("/ajustes/calendarios#google");
    expect(legacyTarget("iphone")).toBe("/ajustes/calendarios#iphone");
    expect(legacyTarget("#avisos-celular")).toBe("/ajustes/notificacoes#avisos-celular");
    expect(legacyTarget("#ia")).toBe("/ajustes/mensagens#ia");
    expect(legacyTarget("#expediente")).toBe("/ajustes/expediente#expediente");
  });
  it("âncora desconhecida ou vazia não redireciona", () => {
    expect(legacyTarget("")).toBeNull();
    expect(legacyTarget("#toString")).toBeNull();
    expect(legacyTarget("#qualquer")).toBeNull();
  });
  it("toda seção mora embaixo de /ajustes", () => {
    for (const s of Object.values(SECTIONS)) expect(s.href).toMatch(/^\/ajustes\/[a-z]+$/);
  });
  it("resumo do expediente", () => {
    expect(hoursSummary([null, open, open, open, open, open, null])).toBe("Seg a Sex");
    expect(hoursSummary(Array(7).fill(open))).toBe("Todos os dias");
    expect(hoursSummary(Array(7).fill(null))).toBe("Fechado a semana toda");
    expect(hoursSummary([null, open, null, open, null, open, null])).toBe("Seg, Qua e Sex");
    expect(hoursSummary([null, null, open, null, null, null, null])).toBe("Ter");
    expect(hoursSummary([open, open, null, null, null, null, null])).toBe("Dom e Seg");
  });
});
