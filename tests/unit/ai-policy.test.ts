import { describe, expect, it, vi } from "vitest";
import { handoffText, mediaText, planAiReply, type AiContext, type AiVerdict } from "@/features/messaging/ai-policy";
import { parseVerdict } from "@/features/messaging/classify";

const ctx = (over: Partial<AiContext> = {}): AiContext => ({
  media: false,
  clientName: "Bia Souza",
  text: "Oi, tudo bem? Posso ir um pouquinho depois?",
  ownerWroteRecently: false,
  autoRepliesLast24h: 0,
  alreadyHandedOff: false,
  ...over,
});
const says = (v: AiVerdict | null) => vi.fn(async () => v);

describe("planAiReply", () => {
  it("confirma sozinha com confiança >= 0.9", async () => {
    expect(await planAiReply(ctx(), says({ intent: "confirm", confidence: 0.9 }))).toEqual({
      action: "apply",
      intent: "confirm",
      sendAck: true,
    });
  });

  it("cancelar e remarcar também são aplicados (o chamador transforma em 'quer remarcar')", async () => {
    expect(await planAiReply(ctx(), says({ intent: "cancel", confidence: 0.95 }))).toMatchObject({ intent: "cancel" });
    expect(await planAiReply(ctx(), says({ intent: "reschedule", confidence: 0.95 }))).toMatchObject({
      intent: "reschedule",
    });
  });

  it("baixa confiança passa para a profissional e guarda o palpite", async () => {
    expect(await planAiReply(ctx(), says({ intent: "confirm", confidence: 0.89 }))).toEqual({
      action: "handoff",
      text: handoffText("Bia Souza"),
      guess: "confirm",
    });
  });

  it.each<[string, AiVerdict | null]>([
    ["atraso", { intent: "late", confidence: 0.99 }],
    ["outro assunto", { intent: "other", confidence: 0.99 }],
    ["erro ou sem chave", null],
  ])("%s passa para a profissional", async (_n, v) => {
    expect(await planAiReply(ctx(), says(v))).toMatchObject({ action: "handoff", text: handoffText("Bia Souza"), guess: null });
  });

  it("áudio/foto não chama o modelo e avisa que a profissional continua", async () => {
    const classify = says({ intent: "confirm", confidence: 1 });
    expect(await planAiReply(ctx({ media: true, text: "[áudio]" }), classify)).toEqual({
      action: "handoff",
      text: mediaText("Bia Souza"),
      guess: null,
    });
    expect(classify).not.toHaveBeenCalled();
  });

  it("mensagem com mais de 1000 caracteres vai direto para a profissional; 1000 ainda vai para o modelo", async () => {
    const classify = says({ intent: "confirm", confidence: 1 });
    expect(await planAiReply(ctx({ text: "a".repeat(1001) }), classify)).toMatchObject({ action: "handoff" });
    expect(classify).not.toHaveBeenCalled();
    expect(await planAiReply(ctx({ text: "a".repeat(1000) }), classify)).toMatchObject({ action: "apply" });
  });

  it("fica quieta se a dona escreveu nas últimas 12h, sem nem chamar o modelo", async () => {
    const classify = says({ intent: "confirm", confidence: 1 });
    expect(await planAiReply(ctx({ ownerWroteRecently: true }), classify)).toEqual({ action: "silent", guess: null, quiet: true });
    expect(classify).not.toHaveBeenCalled();
  });

  it("depois de 3 respostas automáticas em 24h não responde mais, mas ainda aplica o que entendeu", async () => {
    expect(await planAiReply(ctx({ autoRepliesLast24h: 3 }), says({ intent: "confirm", confidence: 1 }))).toEqual({
      action: "apply",
      intent: "confirm",
      sendAck: false,
    });
    expect(await planAiReply(ctx({ autoRepliesLast24h: 3 }), says({ intent: "other", confidence: 1 }))).toEqual({
      action: "silent",
      guess: null,
      quiet: false,
    });
  });

  it("uma passagem por agendamento: a segunda fica em silêncio", async () => {
    expect(await planAiReply(ctx({ alreadyHandedOff: true }), says({ intent: "other", confidence: 1 }))).toEqual({
      action: "silent",
      guess: null,
      quiet: false,
    });
  });
});

describe("parseVerdict", () => {
  it("aceita JSON válido, mesmo com texto em volta", () => {
    expect(parseVerdict('Claro: {"intent":"confirm","confidence":0.97}')).toEqual({ intent: "confirm", confidence: 0.97 });
  });
  it.each(["", "oi", '{"intent":"x","confidence":1}', '{"intent":"confirm","confidence":2}', '{"intent":"confirm"}'])(
    "recusa %j",
    (raw) => expect(parseVerdict(raw)).toBeNull(),
  );
});
