import type { Intent } from "./replies";

/** O que o modelo entendeu da mensagem, com a confiança dele. */
export type AiVerdict = { intent: Intent | "late" | "other"; confidence: number };

/** Só confirma sozinha com certeza alta. */
export const AI_MIN_CONFIDENCE = 0.9;
/** Mensagens maiores que isso nem vão para o modelo: a profissional lê. */
export const AI_MAX_CHARS = 1000;
/** No máximo 3 respostas automáticas por cliente a cada 24h. */
export const AI_MAX_REPLIES_24H = 3;
/** Se a profissional escreveu nas últimas 12h, a IA fica quieta. */
export const OWNER_QUIET_HOURS = 12;
/** A cliente pode corrigir a resposta até 2h depois de ter respondido ao lembrete. */
export const CORRECTION_HOURS = 2;

/** Passagem para a profissional, com tom acolhedor. O nome vem pronto (primeiro nome ou inteiro, como em Ajustes). */
export const handoffText = (clientName: string) =>
  `Oi, ${clientName}! Recebi sua mensagem e já passei para a profissional, ela te responde rapidinho 💜`;
/** Áudio, foto ou figurinha: mesmo acolhimento, sem fingir que entendeu o conteúdo. */
export const mediaText = (clientName: string) =>
  `Oi, ${clientName}! Recebi seu envio e já passei para a profissional, ela te responde rapidinho 💜`;

export type AiContext = {
  /** Áudio, foto ou figurinha: a IA não lê */
  media: boolean;
  text: string;
  /** Nome da cliente como vai na mensagem (primeiro nome ou inteiro, como a dona escolheu em Ajustes) */
  clientName: string;
  /** A dona escreveu para esta cliente nas últimas 12h */
  ownerWroteRecently: boolean;
  /** Respostas automáticas já enviadas a esta cliente nas últimas 24h */
  autoRepliesLast24h: number;
  /** Este agendamento já foi passado para a profissional */
  alreadyHandedOff: boolean;
};

/**
 * - apply: a IA entendeu com certeza; aplica a intenção (`sendAck` = ainda cabe resposta automática)
 * - handoff: avisa a cliente que a profissional continua a conversa
 * - silent: não responde nada à cliente; `guess` é o palpite, se houver. `quiet` = a dona já está na conversa,
 *   então nem avisa; sem `quiet`, a dona recebe o aviso "precisa de você" (nenhuma resposta fica sem alerta)
 */
export type AiPlan =
  | { action: "apply"; intent: Intent; sendAck: boolean }
  | { action: "handoff"; text: string; guess: Intent | null }
  | { action: "silent"; guess: Intent | null; quiet: boolean };

const asIntent = (v: AiVerdict | null): Intent | null =>
  v && (v.intent === "confirm" || v.intent === "cancel" || v.intent === "reschedule") ? v.intent : null;

/**
 * Decide o que fazer com a mensagem que as regras simples não entenderam. Ordem: dona presente → quieto;
 * mídia ou texto longo → passa direto (sem custo de modelo); senão pergunta ao modelo e só aplica com certeza.
 * Atraso, "outro assunto", baixa confiança, erro ou falta de chave → passa para a profissional.
 */
export async function planAiReply(ctx: AiContext, classify: () => Promise<AiVerdict | null>): Promise<AiPlan> {
  if (ctx.ownerWroteRecently) return { action: "silent", guess: null, quiet: true };
  const underLimit = ctx.autoRepliesLast24h < AI_MAX_REPLIES_24H;
  const handoff = (text: string, guess: Intent | null): AiPlan =>
    underLimit && !ctx.alreadyHandedOff ? { action: "handoff", text, guess } : { action: "silent", guess, quiet: false };

  if (ctx.media) return handoff(mediaText(ctx.clientName), null);
  if (ctx.text.length > AI_MAX_CHARS) return handoff(handoffText(ctx.clientName), null);

  const verdict = await classify();
  const intent = asIntent(verdict);
  if (intent && verdict && verdict.confidence >= AI_MIN_CONFIDENCE) return { action: "apply", intent, sendAck: underLimit };
  return handoff(handoffText(ctx.clientName), intent);
}
