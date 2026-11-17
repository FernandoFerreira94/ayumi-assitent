import { describe, expect, it } from "vitest";
import { canEditServices, canOpenPath } from "@/features/team/access";

describe("telas por papel", () => {
  it("dona e gerente abrem tudo", () => {
    for (const role of ["owner", "admin"] as const)
      for (const p of ["/financeiro", "/ajustes/whatsapp", "/ajustes/equipe", "/servicos"])
        expect(canOpenPath(role, p)).toBe(true);
  });
  it("profissional não abre financeiro, WhatsApp, mensagens nem equipe", () => {
    for (const p of ["/financeiro", "/financeiro?m=2030-01", "/ajustes/whatsapp", "/ajustes/mensagens", "/ajustes/equipe"])
      expect(canOpenPath("professional", p.split("?")[0]!)).toBe(false);
  });
  it("profissional abre agenda, serviços, clientes, calendários, notificações e expediente", () => {
    for (const p of ["/agenda", "/servicos", "/clientes/1", "/ajustes", "/ajustes/calendarios", "/ajustes/notificacoes", "/ajustes/expediente"])
      expect(canOpenPath("professional", p)).toBe(true);
  });
  it("serviços: só dona e gerente editam", () => {
    expect(canEditServices("owner")).toBe(true);
    expect(canEditServices("admin")).toBe(true);
    expect(canEditServices("professional")).toBe(false);
  });
});
