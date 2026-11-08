import { describe, expect, it } from "vitest";
import { buildAvisos, pendenciaAvisos } from "@/features/notifications/core";

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
    expect(pendenciaAvisos({ toClose: 0, toConfirm: 0, unsynced: 0 })).toEqual([]);
  });
  it("gera só os tipos com algo a resolver, no singular e no plural", () => {
    const titles = pendenciaAvisos({ toClose: 1, toConfirm: 0, unsynced: 3 }).map((a) => a.title);
    expect(titles).toEqual(["1 atendimento para fechar", "3 atendimentos fora do Google Agenda"]);
  });
});
