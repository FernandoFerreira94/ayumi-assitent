import type { Tx } from "@/db/client";
import { unclearReplies } from "@/db/schema";
import { errCode, log } from "@/lib/log";

/** Rótulos que o dono dá a uma resposta não entendida (viram exemplos e casos de teste). */
export const UNCLEAR_LABELS = ["confirm", "cancel", "reschedule", "late", "question", "other"] as const;
export type UnclearLabel = (typeof UNCLEAR_LABELS)[number];
export const UNCLEAR_LABEL_TEXT: Record<UnclearLabel, string> = {
  confirm: "Confirmar",
  cancel: "Cancelar",
  reschedule: "Remarcar",
  late: "Atraso",
  question: "Dúvida",
  other: "Outro",
};

export type UnclearDecision = "alerted" | "silent" | "guess" | "ambiguous";

/**
 * Padrão para agrupar mensagens parecidas: sem acento, minúsculo, sem pontuação e com números trocados por "#"
 * ("Confirmo às 14h!" e "confirmo as 15h" caem juntas).
 */
export function unclearPattern(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/[^\p{L}#\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Guarda a possível resposta que o sistema não entendeu (só o painel do dono lê). Nunca lança: guardar é para
 * melhorar o sistema e não pode atrapalhar a mensagem da cliente. Nada de telefone: a cliente vai pelo id.
 */
export async function recordUnclear(
  tx: Tx,
  row: {
    tenantId: string;
    clientId: string;
    appointmentId: string | null;
    question: "reminder" | "ambiguous";
    body: string;
    aiIntent: string | null;
    aiConfidence: number | null;
    decision: UnclearDecision;
  },
): Promise<void> {
  // Savepoint: um erro aqui não pode abortar a transação da mensagem da cliente
  await tx
    .transaction((sp) => sp.insert(unclearReplies).values({ ...row, body: row.body.slice(0, 500) }))
    .catch((e) => log("warn", "unclear_record_failed", errCode(e)));
}
