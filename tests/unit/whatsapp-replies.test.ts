import { describe, expect, it } from "vitest";
import { ackText, cancelAskText, freeTextAck, nudgeText, parseCancelFollowUp, parseIntent, parseUpsert, phoneCandidates } from "@/features/messaging/replies";

describe("resposta ao lembrete", () => {
  it("entende as opções numeradas", () => {
    expect(parseIntent("1")).toBe("confirm");
    expect(parseIntent(" 2 ")).toBe("cancel");
    expect(parseIntent("Opção 3")).toBe("reschedule");
  });
  it("entende o jeito que a cliente fala", () => {
    for (const t of ["ok", "Sim!", "confirmo", "Confirmado 💜", "pode ser", "vou sim", "👍", "✅"]) expect(parseIntent(t), t).toBe("confirm");
    for (const t of ["cancelar", "Cancela por favor", "não vou poder", "nao consigo ir", "desmarca"]) expect(parseIntent(t), t).toBe("cancel");
    for (const t of ["3 remarcar", "quero remarcar", "Reagendar", "tem outro horário?", "sim, mas preciso remarcar"]) expect(parseIntent(t), t).toBe("reschedule");
  });
  it("número no meio da frase é hora, não opção", () => {
    expect(parseIntent("posso chegar 2 minutos antes?")).not.toBe("cancel");
    expect(parseIntent("chego 10 min atrasada")).toBeNull();
  });
  it("conversa que não é resposta fica sem intenção", () => {
    expect(parseIntent("Oi! Você faz unha de fibra também?")).toBeNull();
    expect(parseIntent("Bom dia, tudo bem com você? Queria saber se amanhã tem estacionamento aí perto do salão")).toBeNull();
  });
});

describe("agradecimento automático", () => {
  it("usa o primeiro nome e diz o que aconteceu", () => {
    expect(ackText("confirm", "Maria Silva")).toContain("Maria! Seu horário está confirmado");
    expect(ackText("cancel", "Bia")).toContain("Cancelei seu horário");
    expect(ackText("reschedule", "Bia")).toContain("novo horário");
  });
});

describe("telefone do WhatsApp", () => {
  it("acha a cliente com ou sem o nono dígito", () => {
    expect(phoneCandidates("551187654321")).toEqual(["+551187654321", "+5511987654321"]);
    expect(phoneCandidates("5511987654321")).toEqual(["+5511987654321", "+551187654321"]);
    // Fixo (começa com 2 a 5) não ganha nono dígito
    expect(phoneCandidates("551134567890")).toEqual(["+551134567890"]);
  });
});

describe("webhook da Evolution", () => {
  const body = (key: object, message: object = { conversation: "1" }) => ({ event: "messages.upsert", instance: "studio-x", data: { key, message } });
  it("tira instância, id, número e texto", () => {
    expect(parseUpsert(body({ remoteJid: "5511987654321@s.whatsapp.net", fromMe: false, id: "ABC" }))).toEqual({
      instance: "studio-x",
      externalId: "ABC",
      fromMe: false,
      phoneDigits: "5511987654321",
      text: "1",
    });
  });
  it("usa o número alternativo quando o contato vem por LID", () => {
    expect(parseUpsert(body({ remoteJid: "123456@lid", remoteJidAlt: "5511987654321@s.whatsapp.net", id: "A" }))?.phoneDigits).toBe("5511987654321");
  });
  it("ignora grupo, mídia sem texto e outros eventos", () => {
    expect(parseUpsert(body({ remoteJid: "1203630@g.us", id: "A" }))).toBeNull();
    expect(parseUpsert(body({ remoteJid: "5511987654321@s.whatsapp.net", id: "A" }, { imageMessage: {} }))).toBeNull();
    expect(parseUpsert({ event: "connection.update", instance: "x" })).toBeNull();
  });
  it("aceita texto estendido (resposta citando o lembrete)", () => {
    expect(parseUpsert(body({ remoteJid: "5511987654321@s.whatsapp.net", id: "A" }, { extendedTextMessage: { text: "Confirmo" } }))?.text).toBe("Confirmo");
  });
});

describe("resposta à pergunta de cancelamento", () => {
  it("1 cancela, 2 remarca", () => {
    expect(parseCancelFollowUp("1")).toBe("cancel");
    expect(parseCancelFollowUp("Opção 2")).toBe("reschedule");
    expect(parseCancelFollowUp("3")).toBeNull();
  });
  it("entende palavras", () => {
    for (const t of ["sim", "cancelar", "quero cancelar", "não vou conseguir"]) expect(parseCancelFollowUp(t), t).toBe("cancel");
    for (const t of ["remarcar", "prefiro reagendar", "outro dia"]) expect(parseCancelFollowUp(t), t).toBe("reschedule");
    for (const t of ["manter", "não quero cancelar", "vou sim"]) expect(parseCancelFollowUp(t), t).toBe("confirm");
  });
  it("conversa solta não decide nada", () => {
    expect(parseCancelFollowUp("Qual o endereço mesmo?")).toBeNull();
  });
});

describe("textos automáticos", () => {
  it("pergunta de cancelamento com opções", () => {
    expect(cancelAskText("Bia Souza")).toBe("Bia, quer cancelar mesmo ou prefere remarcar?\n1 - Cancelar\n2 - Remarcar");
  });
  it("reforço e aviso de texto livre", () => {
    expect(nudgeText("Maria Silva")).toBe("Ainda não recebi sua confirmação, Maria 😊 Responda 1 para confirmar");
    expect(freeTextAck("Studio Yumi")).toBe("Recebi! Studio Yumi vai te responder em breve 💜");
    expect(freeTextAck(null)).toContain("Recebi!");
  });
});
