import { notify } from "@/components/feedback/toast";
import { rescheduleNoticeToast, type RescheduleNoticeResult } from "@/features/messaging/reschedule-result";
import { flushRescheduleNotice } from "./actions";

/** Mostra à dona se o aviso de remarcação saiu ou por que não saiu (nada quando não há o que dizer). */
export function showRescheduleNotice(result: RescheduleNoticeResult | null | undefined, clientName: string) {
  const t = rescheduleNoticeToast(result, clientName);
  if (t) notify[t.kind](t.title, t.description);
}

/** Espera do Desfazer do arraste (o toast fica 6 s) antes de mandar o aviso. */
export const FLUSH_DELAY_MS = 8_500;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Depois de arrastar: espera o Desfazer e manda o aviso. Arrastou de novo antes? Recomeça a espera e só o horário
 * final vai. Fica no módulo (não no componente) para sobreviver à troca de tela; se o app fechar, o worker manda.
 */
export function scheduleRescheduleNotice(id: string, clientName: string) {
  clearTimeout(timers.get(id));
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id);
      void flushRescheduleNotice(id)
        .then((r) => showRescheduleNotice(r.ok ? r.data.notice : null, clientName))
        .catch(() => {});
    }, FLUSH_DELAY_MS),
  );
}
