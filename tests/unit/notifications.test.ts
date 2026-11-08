import { describe, expect, it } from "vitest";
import { buildAvisos, messageAvisos, pendenciaAvisos } from "@/features/notifications/core";

describe("avisos do app", () => {
  it("tudo conectado não gera aviso", () => {
    expect(buildAvisos({ whatsapp: "open", google: true })).toEqual([]);
  });
  it("WhatsApp fora do ar e Google desconectado geram um aviso cada", () => {
    expect(buildAvisos({ whatsapp: "other", google: false }).map((a) => a.id)).toEqual(["whatsapp", "google"]);
  });
  it("WhatsApp indisponível para consulta não alarma", () => {
    expect(buildAvisos({ whatsapp: "unavailable", google: true })).toEqual([]);
  });
});

describe("pendências no sino", () => {
  it("sem pendência não gera linha", () => {
    expect(pendenciaAvisos({ toClose: 0, toConfirm: 0, unsynced: 0, toReschedule: 0 })).toEqual([]);
  });
  it("gera só os tipos com algo a resolver, no singular e no plural", () => {
    const titles = pendenciaAvisos({ toClose: 1, toConfirm: 0, unsynced: 3, toReschedule: 2 }).map((a) => a.title);
    expect(titles).toEqual(["2 clientes querem remarcar", "1 atendimento para fechar", "3 atendimentos fora do Google Agenda"]);
  });
});

describe("mensagens novas no sino", () => {
  it("diz o que a cliente respondeu e leva à conversa dela", () => {
    const [a, b] = messageAvisos([
      { clientId: "c1", clientName: "Maria Silva", count: 1, lastBody: "1", lastIntent: "confirm" },
      { clientId: "c2", clientName: "Bia", count: 2, lastBody: "Oi, tudo bem?", lastIntent: null },
    ]);
    expect(a).toMatchObject({ id: "message-c1", title: "Maria confirmou o horário", href: "/clientes?q=Maria%20Silva" });
    expect(b.title).toBe("Bia mandou mensagem");
    expect(b.hint).toContain("2 mensagens novas");
  });
});
