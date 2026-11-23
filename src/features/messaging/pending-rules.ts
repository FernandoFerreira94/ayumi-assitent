import { slotLabel } from "@/features/reminders/text";
import { ackText, type Intent } from "./replies";

/**
 * Cancelar e remarcar não mexem no horário sozinhos: os dois viram "quer remarcar" e a profissional
 * decide o melhor horário com a cliente pela conversa.
 */
export const STATUS_FOR: Record<Intent, "confirmed" | "reschedule_requested"> = {
  confirm: "confirmed",
  cancel: "reschedule_requested",
  reschedule: "reschedule_requested",
};

const INTENTS = Object.keys(STATUS_FOR) as Intent[];

/** O que fica guardado à noite: só o pedido, nunca o texto pronto. */
export const pendingMarker = (intent: Intent) => `@${intent}`;

/**
 * Texto da resposta guardada, montado na hora de sair. null = não sai mais: o horário mudou de estado (a dona
 * cancelou, remarcou, a cliente trocou a resposta) ou já passou. Texto antigo (antes do marcador) sai como está.
 */
export function pendingText(
  stored: string,
  a: { status: string; startsAt: Date; clientName: string; fullName: boolean },
  now: Date,
): string | null {
  if (!stored.startsWith("@")) return stored;
  const intent = stored.slice(1) as Intent;
  if (!INTENTS.includes(intent)) return null;
  if (a.status !== STATUS_FOR[intent] || a.startsAt <= now) return null;
  return ackText(intent, a.clientName, a.fullName, slotLabel(a.startsAt, now));
}
