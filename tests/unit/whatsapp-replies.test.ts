import { describe, expect, it } from "vitest";
import { ackText, nudgeText, parseIntent, parseUpsert, phoneCandidates } from "@/features/messaging/replies";

describe("resposta ao lembrete", () => {
  it("entende as opções numeradas", () => {
    expect(parseIntent("1")).toBe("confirm");
    expect(parseIntent(" 2 ")).toBe("cancel");
    expect(parseIntent("Opção 3")).toBe("reschedule");
  });
  it("entende o jeito que a cliente fala", () => {
    for (const t of ["ok", "Sim!", "confirmo", "Confirmado 💜", "pode ser", "vou sim", "👍", "✅"])
      expect(parseIntent(t), t).toBe("confirm");
    for (const t of ["cancelar", "Cancela por favor", "não vou poder", "nao consigo ir", "desmarca"])
      expect(parseIntent(t), t).toBe("cancel");
    for (const t of ["3 remarcar", "quero remarcar", "Reagendar", "tem outro horário?", "sim, mas preciso remarcar"])
      expect(parseIntent(t), t).toBe("reschedule");
  });
  it("número no meio da frase é hora, não opção", () => {
    expect(parseIntent("posso chegar 2 minutos antes?")).not.toBe("cancel");
    expect(parseIntent("chego 10 min atrasada")).toBeNull();
  });
  it("dúvida, ressalva ou pergunta nunca confirma", () => {
    for (const t of [
      "não sei se vou",
      "ok, mas dá pra ser às 15h?",
      "vou atrasar uns 10 min",
      "ok mas...",
      "vou?",
      "ok?",
      "se der eu vou",
      "talvez",
      "acho que vou",
    ])
      expect(parseIntent(t), t).toBeNull();
  });
  it("confirmações claras seguem valendo", () => {
    for (const t of ["1", "sim", "ok", "pode confirmar", "confirmado", "👍", "✅", "estarei lá", "Estarei aí!"])
      expect(parseIntent(t), t).toBe("confirm");
  });
  it("negação nunca vira confirmação nem pedido", () => {
    for (const t of [
      "não confirmo",
      "não precisa confirmar",
      "não posso confirmar",
      "não esqueci",
      "vou ver e te falo",
      "ainda não sei",
      "te aviso depois",
      "sim, mas vou atrasar",
    ])
      expect(parseIntent(t), t).toBeNull();
    // Negou a ação de cancelar/remarcar: a dona lê, o sistema não mexe no horário
    for (const t of ["não cancele", "não quero cancelar", "não vou cancelar", "não quero remarcar", "não precisa cancelar, vou sim"])
      expect(parseIntent(t), t).toBeNull();
  });
  it('"não vou faltar" é confirmação, não cancelamento', () => {
    for (const t of ["não vou faltar", "não vou deixar de ir", "nao vou esquecer"])
      expect(parseIntent(t), t).toBe("confirm");
  });
  it("pedido misto fica para a dona decidir", () => {
    for (const t of ["sim e cancela o outro", "cancela o de sexta, esse eu vou", "sim não vou cancelar"])
      expect(parseIntent(t), t).toBeNull();
    expect(parseIntent("vou ter que cancelar")).toBe("cancel");
  });
  it("entende variações comuns de sim, número por extenso e emoji com tom de pele", () => {
    for (const t of ["okk", "simm", "ta bom", "tá ótimo", "aham", "uhum", "show", "com certeza", "pode deixar", "yes", "um", "👍🏽", "💜", "1️⃣"])
      expect(parseIntent(t), t).toBe("confirm");
    expect(parseIntent("dois")).toBe("cancel");
    expect(parseIntent("três")).toBe("reschedule");
  });
  it("perguntas e assuntos soltos não mexem no agendamento", () => {
    for (const t of ["quanto custa?", "onde fica?", "posso ir às 16h?", "tô doente", "bom dia", "obrigada", "kkk", "?"])
      expect(parseIntent(t), t).toBeNull();
  });
  it("conversa que não é resposta fica sem intenção", () => {
    expect(parseIntent("Oi! Você faz unha de fibra também?")).toBeNull();
    expect(
      parseIntent("Bom dia, tudo bem com você? Queria saber se amanhã tem estacionamento aí perto do salão"),
    ).toBeNull();
  });
});

describe("resposta automática ao lembrete", () => {
  it("confirmar agradece com o primeiro nome", () => {
    expect(ackText("confirm", "Maria Silva")).toContain("Maria! Seu horário está confirmado");
  });
  it("cancelar e remarcar só dizem que a profissional vai verificar o melhor horário", () => {
    for (const intent of ["cancel", "reschedule"] as const) {
      const t = ackText(intent, "Bia Souza");
      expect(t).toContain("Bia!");
      expect(t).toContain("verificar com a profissional o melhor horário");
      expect(t).not.toMatch(/cancelei|cancelado/i);
    }
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
  const body = (key: object, message: object = { conversation: "1" }) => ({
    event: "messages.upsert",
    instance: "studio-x",
    data: { key, message },
  });
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
    expect(
      parseUpsert(body({ remoteJid: "123456@lid", remoteJidAlt: "5511987654321@s.whatsapp.net", id: "A" }))
        ?.phoneDigits,
    ).toBe("5511987654321");
  });
  it("ignora grupo e outros eventos", () => {
    expect(parseUpsert(body({ remoteJid: "1203630@g.us", id: "A" }))).toBeNull();
    expect(parseUpsert({ event: "connection.update", instance: "x" })).toBeNull();
  });
  it("áudio, foto e figurinha sem legenda chegam marcados como mídia; os da própria dona são ignorados", () => {
    const jid = { remoteJid: "5511987654321@s.whatsapp.net", id: "A" };
    expect(parseUpsert(body(jid, { imageMessage: {} }))).toMatchObject({ media: true, text: "[foto]" });
    expect(parseUpsert(body(jid, { audioMessage: {} }))).toMatchObject({ media: true, text: "[áudio]" });
    expect(parseUpsert(body({ ...jid, fromMe: true }, { audioMessage: {} }))).toBeNull();
  });
  it("aceita texto estendido (resposta citando o lembrete)", () => {
    expect(
      parseUpsert(
        body({ remoteJid: "5511987654321@s.whatsapp.net", id: "A" }, { extendedTextMessage: { text: "Confirmo" } }),
      )?.text,
    ).toBe("Confirmo");
  });
});

describe("2º aviso", () => {
  it("pede a confirmação com o primeiro nome", () => {
    expect(nudgeText("Maria Silva")).toBe("Ainda não recebi sua confirmação, Maria 😊 Responda 1 para confirmar");
  });
});
