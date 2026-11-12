import type { MascotMood } from "./Mascot";

/** Os cinco tipos de retorno do app (toast, telas de erro, agendando, sem internet). */
export type FeedbackKind = "success" | "error" | "warning" | "info" | "loading";

/**
 * Registro único: tipo de retorno → expressão do mascote. Vale para os 8 mascotes (o rosto é o mesmo em todos),
 * então trocar o tema em Meu perfil troca o corpo e as cores, e a expressão continua dizendo o que aconteceu.
 */
export const FEEDBACK_MOOD: Record<FeedbackKind, MascotMood> = {
  success: "happy",
  error: "sad",
  warning: "alert",
  info: "neutral",
  loading: "thinking",
};
