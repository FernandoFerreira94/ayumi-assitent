import { describe, expect, it } from "vitest";
import { appointmentRecipients, noticeScope, type Member } from "@/features/push/recipients";

const dona: Member = { userId: "dona", role: "owner", professionalId: null };
const gerente: Member = { userId: "gerente", role: "admin", professionalId: null };
const ana: Member = { userId: "ana", role: "professional", professionalId: "p-ana" };
const bia: Member = { userId: "bia", role: "professional", professionalId: "p-bia" };
const semVinculo: Member = { userId: "solta", role: "professional", professionalId: null };
const team = [dona, gerente, ana, bia, semVinculo];

describe("quem recebe o push de um atendimento", () => {
  it("a profissional do atendimento e a dona/admin; as outras não", () => {
    expect([...appointmentRecipients(team, "p-ana")].sort()).toEqual(["ana", "dona", "gerente"]);
    expect([...appointmentRecipients(team, "p-bia")].sort()).toEqual(["bia", "dona", "gerente"]);
  });
  it("profissional sem login: só dona/admin", () => {
    expect([...appointmentRecipients(team, "p-carla")].sort()).toEqual(["dona", "gerente"]);
  });
  it("sem profissional no atendimento: só dona/admin", () => {
    expect([...appointmentRecipients(team, null)].sort()).toEqual(["dona", "gerente"]);
  });
  it("dona que atende não recebe duas vezes", () => {
    const donaQueAtende: Member = { ...dona, professionalId: "p-dona" };
    const r = appointmentRecipients([donaQueAtende, ana], "p-dona");
    expect([...r]).toEqual(["dona"]);
  });
});

describe("recorte dos avisos do dia", () => {
  it("owner e admin veem o salão; profissional vê a própria agenda", () => {
    expect(noticeScope(dona)).toEqual({ professionalId: null });
    expect(noticeScope(gerente)).toEqual({ professionalId: null });
    expect(noticeScope(ana)).toEqual({ professionalId: "p-ana" });
  });
  it("owner ligada a uma profissional continua vendo o salão", () => {
    expect(noticeScope({ ...dona, professionalId: "p-dona" })).toEqual({ professionalId: null });
  });
  it("profissional sem agenda ligada não recebe aviso do dia", () => {
    expect(noticeScope(semVinculo)).toBeNull();
  });
});
