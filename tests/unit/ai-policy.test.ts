import { describe, expect, it, vi } from "vitest";
import { looksLikeAnswer, planAiReply, type AiContext, type AiVerdict } from "@/features/messaging/ai-policy";
import { parseVerdict } from "@/features/messaging/classify";

const ctx = (over: Partial<AiContext> = {}): AiContext => ({
  media: false,
  text: "pode contar comigo, até amanhã",
  ownerWroteRecently: false,
  autoRepliesLast24h: 0,
  alreadyHandedOff: false,
  ...over,
});
const says = (v: AiVerdict | null) => vi.fn(async () => v);
const silentToOwner = (guess: string | null = null) => ({ action: "silent", guess, quiet: false });

describe("planAiReply (silêncio por padrão)", () => {
  it("confirma sozinha com confiança >= 0.9", async () => {
    expect(await planAiReply(ctx(), says({ intent: "confirm", confidence: 0.9 }))).toEqual({
      action: "apply",
      intent: "confirm",
      sendAck: true,
    });
  });

  it("cancelar e remarcar pela IA nunca são aplicados nem respondidos: só avisa a dona com o palpite", async () => {
    expect(await planAiReply(ctx(), says({ intent: "cancel", confidence: 0.99 }))).toEqual(silentToOwner("cancel"));
    expect(await planAiReply(ctx(), says({ intent: "reschedule", confidence: 0.99 }))).toEqual(
      silentToOwner("reschedule"),
    );
  });

  it.each<[string, AiVerdict | null]>([
    ["baixa confiança", { intent: "confirm", confidence: 0.89 }],
    ["atraso", { intent: "late", confidence: 0.99 }],
    ["outro assunto", { intent: "other", confidence: 0.99 }],
    ["erro ou sem chave", null],
  ])("%s: nada para a cliente, aviso para a dona", async (_n, v) => {
    const plan = await planAiReply(ctx(), says(v));
    expect(plan).toMatchObject({ action: "silent", quiet: false });
  });

  it("avisa a dona uma vez por pergunta: depois fica em silêncio total", async () => {
    expect(await planAiReply(ctx({ alreadyHandedOff: true }), says({ intent: "other", confidence: 1 }))).toEqual({
      action: "silent",
      guess: null,
      quiet: true,
    });
  });

  it("áudio/foto não chama o modelo e não responde à cliente", async () => {
    const classify = says({ intent: "confirm", confidence: 1 });
    expect(await planAiReply(ctx({ media: true, text: "[áudio]" }), classify)).toEqual(silentToOwner());
    expect(classify).not.toHaveBeenCalled();
  });

  it("lista ou texto longo (caso real: contas do mês) é conversa: nem modelo, nem aviso", async () => {
    const classify = says({ intent: "confirm", confidence: 1 });
    const lista = "Contas dezembro\n\nCartão dia 1\n124,95 12/12\n455,81 3/3\n100 gasolina\n\n902,31";
    expect(await planAiReply(ctx({ text: lista }), classify)).toEqual({ action: "silent", guess: null, quiet: true });
    expect(await planAiReply(ctx({ text: "a".repeat(201) }), classify)).toMatchObject({ quiet: true });
    expect(classify).not.toHaveBeenCalled();
  });

  it("fica quieta se a dona escreveu nas últimas 12h, sem nem chamar o modelo", async () => {
    const classify = says({ intent: "confirm", confidence: 1 });
    expect(await planAiReply(ctx({ ownerWroteRecently: true }), classify)).toEqual({
      action: "silent",
      guess: null,
      quiet: true,
    });
    expect(classify).not.toHaveBeenCalled();
  });

  it("depois de 3 respostas automáticas em 24h ainda confirma, mas sem agradecer", async () => {
    expect(await planAiReply(ctx({ autoRepliesLast24h: 3 }), says({ intent: "confirm", confidence: 1 }))).toEqual({
      action: "apply",
      intent: "confirm",
      sendAck: false,
    });
  });
});

describe("looksLikeAnswer", () => {
  it("curta e em até 3 linhas", () => {
    expect(looksLikeAnswer("1")).toBe(true);
    expect(looksLikeAnswer("Oi! Confirmo sim, obrigada")).toBe(true);
    expect(looksLikeAnswer("a\nb\nc\nd")).toBe(false);
    expect(looksLikeAnswer("x".repeat(201))).toBe(false);
    expect(looksLikeAnswer("   ")).toBe(false);
  });
});

describe("parseVerdict", () => {
  it("aceita JSON válido, mesmo com texto em volta", () => {
    expect(parseVerdict('Claro: {"intent":"confirm","confidence":0.97}')).toEqual({
      intent: "confirm",
      confidence: 0.97,
    });
  });
  it.each(["", "oi", '{"intent":"x","confidence":1}', '{"intent":"confirm","confidence":2}', '{"intent":"confirm"}'])(
    "recusa %j",
    (raw) => expect(parseVerdict(raw)).toBeNull(),
  );
});
