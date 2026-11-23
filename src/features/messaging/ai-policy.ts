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

/**
 * Silêncio por padrão (23/11): o sistema só informa e só conversa quando pede a confirmação do horário. Uma mensagem
 * só é tratada como resposta se chegou até `ANSWER_WINDOW_HOURS` depois da pergunta e tem cara de resposta (curta,
 * sem lista). Fora disso é conversa da cliente com a dona: nada automático, nem texto de "não entendi".
 */
export const ANSWER_WINDOW_HOURS = 12;
export const ANSWER_MAX_CHARS = 200;
export const ANSWER_MAX_LINES = 3;

/** Tem cara de resposta a "1, 2 ou 3?": curta e em poucas linhas (lista de contas, recado longo = conversa). */
export function looksLikeAnswer(text: string): boolean {
  const t = text.trim();
  return (
    t.length > 0 && t.length <= ANSWER_MAX_CHARS && t.split("\n").filter((l) => l.trim()).length <= ANSWER_MAX_LINES
  );
}

export type AiContext = {
  /** Áudio, foto ou figurinha: a IA não lê */
  media: boolean;
  text: string;
  /** A dona escreveu para esta cliente nas últimas 12h */
  ownerWroteRecently: boolean;
  /** Respostas automáticas já enviadas a esta cliente nas últimas 24h */
  autoRepliesLast24h: number;
  /** A dona já foi avisada de que esta pergunta precisa dela */
  alreadyHandedOff: boolean;
};

/**
 * - apply: a IA entendeu com certeza que é uma confirmação; aplica (`sendAck` = ainda cabe resposta automática)
 * - silent: não responde nada à cliente; `guess` é o palpite, se houver. `quiet` = nem avisa a dona; sem `quiet`, a
 *   dona recebe o aviso "precisa de você" (uma vez por pergunta)
 */
export type AiPlan =
  { action: "apply"; intent: Intent; sendAck: boolean } | { action: "silent"; guess: Intent | null; quiet: boolean };

const asIntent = (v: AiVerdict | null): Intent | null =>
  v && (v.intent === "confirm" || v.intent === "cancel" || v.intent === "reschedule") ? v.intent : null;

/**
 * Decide o que fazer com a mensagem que as regras simples não entenderam, já dentro da janela de resposta.
 * A IA só pode confirmar sozinha (certeza ≥ 0,9). Cancelar, remarcar, atraso, dúvida ou outro assunto nunca geram
 * texto para a cliente: no máximo um aviso para a dona. Mídia, texto longo ou lista nem vão para o modelo.
 */
export async function planAiReply(ctx: AiContext, classify: () => Promise<AiVerdict | null>): Promise<AiPlan> {
  if (ctx.ownerWroteRecently) return { action: "silent", guess: null, quiet: true };
  const tellOwner = (guess: Intent | null): AiPlan => ({ action: "silent", guess, quiet: ctx.alreadyHandedOff });
  // Áudio ou foto logo depois do lembrete: pode ser a resposta, a dona ouve
  if (ctx.media) return tellOwner(null);
  if (ctx.text.length > AI_MAX_CHARS || !looksLikeAnswer(ctx.text))
    return { action: "silent", guess: null, quiet: true };

  const verdict = await classify();
  const intent = asIntent(verdict);
  if (intent === "confirm" && verdict && verdict.confidence >= AI_MIN_CONFIDENCE)
    return { action: "apply", intent, sendAck: ctx.autoRepliesLast24h < AI_MAX_REPLIES_24H };
  return tellOwner(intent);
}
