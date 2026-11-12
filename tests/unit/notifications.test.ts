import { describe, expect, it } from "vitest";
import { buildAvisos, messageAvisos, noReplyAvisos, pendenciaAvisos } from "@/features/notifications/core";

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
    expect(titles).toEqual([
      "2 clientes querem remarcar",
      "1 atendimento para fechar",
      "3 atendimentos fora do Google Agenda",
    ]);
  });
});

describe("mensagens novas no sino", () => {
  it("só confirmou, cancelar e remarcar viram aviso, e o toque abre a conversa", () => {
    const avisos = messageAvisos([
      { clientId: "c1", clientName: "Maria Silva", count: 1, lastBody: "1", lastIntent: "confirm" },
      { clientId: "c2", clientName: "Bia", count: 2, lastBody: "Oi, tudo bem?", lastIntent: null },
      { clientId: "c3", clientName: "Ana Lima", count: 2, lastBody: "3", lastIntent: "reschedule" },
    ]);
    expect(avisos.map((a) => a.title)).toEqual(["Maria confirmou o horário", "Ana quer remarcar"]);
    expect(avisos[0]).toMatchObject({ id: "message-c1", href: "?conversa=c1" });
    expect(avisos[1].hint).toContain("2 mensagens novas");
  });
  it("quem não respondeu aparece com o horário", () => {
    const [a] = noReplyAvisos([{ id: "a1", clientId: "c9", clientName: "Bia Souza", time: "14:30" }]);
    expect(a).toMatchObject({ id: "noreply-a1", title: "Bia não respondeu", href: "?conversa=c9" });
    expect(a.hint).toContain("14:30");
  });
});

describe("ícone e cor dos avisos", () => {
  it("WhatsApp desconectado é vermelho e o Google é laranja", () => {
    const [w, g] = buildAvisos({ whatsapp: "other", google: false });
    expect(w).toMatchObject({ icon: "wifiOff", tone: "danger" });
    expect(g).toMatchObject({ icon: "google", tone: "warning" });
  });

  it("resposta da cliente pinta pelo pedido", () => {
    const tones = messageAvisos([
      { clientId: "a", clientName: "Ana", count: 1, lastBody: "ok", lastIntent: "confirm" },
      { clientId: "b", clientName: "Bia", count: 1, lastBody: "não vou", lastIntent: "cancel" },
      { clientId: "c", clientName: "Cris", count: 1, lastBody: "outro dia", lastIntent: "reschedule" },
    ]).map((a) => a.tone);
    expect(tones).toEqual(["success", "danger", "warning"]);
  });

  it("todo aviso de pendência tem ícone e tom", () => {
    const avisos = pendenciaAvisos({ toClose: 1, toConfirm: 1, unsynced: 1, toReschedule: 1 });
    for (const a of avisos) expect(a.icon && a.tone).toBeTruthy();
    expect(avisos.find((a) => a.id === "to-close")?.tone).toBe("info");
  });
});
