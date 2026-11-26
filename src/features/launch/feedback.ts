// Regras puras do feedback do lançamento (testáveis sem banco).
import { z } from "zod";

/** O cartão aparece depois desses dias de estúdio: tempo para a dona ter usado de verdade. */
export const FEEDBACK_AFTER_DAYS = 7;
export const FEEDBACK_MAX_LEN = 500;

export const FEEDBACK_QUESTIONS = {
  helps: "O que mais te ajuda no Bubbly?",
  missing: "O que está faltando?",
  score: "De 0 a 10, quanto você indicaria o Bubbly para uma amiga?",
} as const;

const optionalText = z
  .string()
  .trim()
  .max(FEEDBACK_MAX_LEN)
  .transform((s) => s || null);

export const feedbackInput = z.object({
  helps: optionalText,
  missing: optionalText,
  score: z.coerce.number().int().min(0).max(10),
});
export type FeedbackInput = z.infer<typeof feedbackInput>;

/** Mostra o cartão quando o estúdio tem 7 dias ou mais e esta pessoa ainda não respondeu nem pulou. */
export function shouldAskFeedback(tenantCreatedAt: Date, now: Date, alreadyAnswered: boolean): boolean {
  if (alreadyAnswered) return false;
  return now.getTime() - tenantCreatedAt.getTime() >= FEEDBACK_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

export type FeedbackRow = {
  salon: string;
  helps: string | null;
  missing: string | null;
  score: number | null;
  skipped: boolean;
  createdAt: Date;
};

export type FeedbackSummary = { answered: number; skipped: number; average: number | null; nps: number | null };

/**
 * Resumo para o painel do dono. NPS = % de notas 9–10 menos % de 0–6 (quem pulou não entra).
 * Média com uma casa decimal.
 */
export function summarizeFeedback(rows: FeedbackRow[]): FeedbackSummary {
  const scores = rows.filter((r) => !r.skipped && r.score !== null).map((r) => r.score as number);
  const skipped = rows.filter((r) => r.skipped).length;
  if (!scores.length) return { answered: 0, skipped, average: null, nps: null };
  const sum = scores.reduce((a, b) => a + b, 0);
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return {
    answered: scores.length,
    skipped,
    average: Math.round((sum / scores.length) * 10) / 10,
    nps: Math.round(((promoters - detractors) / scores.length) * 100),
  };
}
