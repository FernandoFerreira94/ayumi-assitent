import { describe, expect, it } from "vitest";
import { agendaScope, bookingProfessionalId } from "@/features/team/agenda-scope";

const ANA = { id: "prof-ana", label: "Ana" };
const BIA = { id: "prof-bia", label: "Bia" };
const owner = { role: "owner" as const, professionalId: null };

describe("agendaScope", () => {
  it("com uma profissional ativa nada muda: sem filtro, sem escolha", () => {
    expect(agendaScope(owner, [ANA], ANA.id)).toEqual({ filterId: undefined, choices: [], defaultId: undefined });
  });

  it("dona com 2+ vê Todas por padrão e agenda na primeira", () => {
    const s = agendaScope(owner, [ANA, BIA], null);
    expect(s.filterId).toBeUndefined();
    expect(s.choices).toEqual([ANA, BIA]);
    expect(s.defaultId).toBe(ANA.id);
  });

  it("filtro escolhido vira o padrão do agendar; id desconhecido volta para Todas", () => {
    expect(agendaScope(owner, [ANA, BIA], BIA.id)).toMatchObject({ filterId: BIA.id, defaultId: BIA.id });
    expect(agendaScope(owner, [ANA, BIA], "outra")).toMatchObject({ filterId: undefined, defaultId: ANA.id });
  });

  it("gerente ligada a uma profissional agenda nela por padrão", () => {
    const admin = { role: "admin" as const, professionalId: BIA.id };
    expect(agendaScope(admin, [ANA, BIA]).defaultId).toBe(BIA.id);
  });

  it("profissional vê e agenda só a própria agenda, mesmo pedindo outra", () => {
    const pro = { role: "professional" as const, professionalId: ANA.id };
    expect(agendaScope(pro, [ANA, BIA], BIA.id)).toEqual({ filterId: ANA.id, choices: [], defaultId: ANA.id });
  });
});

describe("bookingProfessionalId", () => {
  it("aceita só uma das opções; senão usa o padrão", () => {
    const s = agendaScope(owner, [ANA, BIA]);
    expect(bookingProfessionalId(s, BIA.id)).toBe(BIA.id);
    expect(bookingProfessionalId(s, "de-outro-salao")).toBe(ANA.id);
    expect(bookingProfessionalId(s, null)).toBe(ANA.id);
  });

  it("profissional não escolhe: vai sempre para a própria", () => {
    const s = agendaScope({ role: "professional", professionalId: ANA.id }, [ANA, BIA]);
    expect(bookingProfessionalId(s, BIA.id)).toBe(ANA.id);
  });
});
