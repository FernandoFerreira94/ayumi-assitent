import { describe, expect, it } from "vitest";
import { ACTIONS, can, canAs, ownAgendaId, type Action, type Role } from "@/features/team/permissions";
import { ERROR_MESSAGES } from "@/lib/errors";

const ANA = "prof-ana";
const BIA = "prof-bia";

/** Ações que não dependem de qual profissional é o alvo. */
const SALAO: Action[] = ["salon.settings", "finance.salon", "services.manage", "clients.manage"];

describe("permissões por papel (can)", () => {
  it("dona (owner) pode tudo, inclusive plano/cobrança e excluir o salão", () => {
    for (const a of ACTIONS) expect(can("owner", a, { ownProfessionalId: ANA, targetProfessionalId: BIA })).toBe(true);
    expect(can("owner", "billing.manage", {})).toBe(true);
    expect(can("owner", "salon.delete", {})).toBe(true);
  });

  it("gerente (admin) pode tudo menos plano/cobrança e excluir o salão", () => {
    for (const a of ACTIONS) {
      const expected = a !== "billing.manage" && a !== "salon.delete";
      expect(can("admin", a, { ownProfessionalId: null, targetProfessionalId: BIA }), a).toBe(expected);
    }
  });

  it("profissional: edita só a própria agenda", () => {
    const own = { ownProfessionalId: ANA, targetProfessionalId: ANA };
    expect(can("professional", "agenda.edit", own)).toBe(true);
    expect(can("professional", "agenda.edit", { ownProfessionalId: ANA, targetProfessionalId: BIA })).toBe(false);
  });

  it("profissional não edita bloqueio do salão todo (alvo null) nem sem alvo", () => {
    expect(can("professional", "agenda.edit", { ownProfessionalId: ANA, targetProfessionalId: null })).toBe(false);
    expect(can("professional", "agenda.edit", { ownProfessionalId: ANA })).toBe(false);
  });

  it("profissional sem vínculo a uma profissional não edita agenda nenhuma", () => {
    expect(can("professional", "agenda.edit", { ownProfessionalId: null, targetProfessionalId: null })).toBe(false);
    expect(can("professional", "agenda.edit", { ownProfessionalId: null, targetProfessionalId: ANA })).toBe(false);
  });

  it("profissional vê só o próprio faturamento, nunca o financeiro do salão", () => {
    expect(can("professional", "finance.own", { ownProfessionalId: ANA, targetProfessionalId: ANA })).toBe(true);
    expect(can("professional", "finance.own", { ownProfessionalId: ANA, targetProfessionalId: BIA })).toBe(false);
    expect(can("professional", "finance.salon", { ownProfessionalId: ANA })).toBe(false);
  });

  it("profissional edita clientes do salão, mas não serviços, ajustes, plano nem excluir salão", () => {
    const ctx = { ownProfessionalId: ANA };
    expect(can("professional", "clients.manage", ctx)).toBe(true);
    expect(can("professional", "services.manage", ctx)).toBe(false);
    expect(can("professional", "salon.settings", ctx)).toBe(false);
    expect(can("professional", "billing.manage", ctx)).toBe(false);
    expect(can("professional", "salon.delete", ctx)).toBe(false);
  });

  it("owner e admin não dependem do alvo nas ações do salão", () => {
    for (const role of ["owner", "admin"] as Role[])
      for (const a of SALAO) expect(can(role, a, {}), `${role} ${a}`).toBe(true);
  });

  it("papel desconhecido não pode nada", () => {
    for (const a of ACTIONS)
      expect(can("staff" as Role, a, { ownProfessionalId: ANA, targetProfessionalId: ANA })).toBe(false);
  });
});

describe("atalhos para as actions", () => {
  it("canAs usa a profissional do próprio login como a própria", () => {
    expect(canAs({ role: "professional", professionalId: ANA }, "agenda.edit", ANA)).toBe(true);
    expect(canAs({ role: "professional", professionalId: ANA }, "agenda.edit", BIA)).toBe(false);
    expect(canAs({ role: "owner", professionalId: ANA }, "agenda.edit", BIA)).toBe(true);
    expect(canAs({ role: "admin", professionalId: null }, "salon.settings")).toBe(true);
  });

  it("ownAgendaId só força a agenda da profissional; owner e admin seguem o padrão do salão", () => {
    expect(ownAgendaId({ role: "professional", professionalId: ANA })).toBe(ANA);
    expect(ownAgendaId({ role: "professional", professionalId: null })).toBeUndefined();
    expect(ownAgendaId({ role: "owner", professionalId: ANA })).toBeUndefined();
    expect(ownAgendaId({ role: "admin", professionalId: ANA })).toBeUndefined();
  });

  it("o erro de falta de permissão existe no catálogo", () => {
    expect(ERROR_MESSAGES.FORBIDDEN).toMatch(/permiss/i);
  });
});
