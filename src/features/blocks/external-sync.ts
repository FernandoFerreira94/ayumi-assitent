import "server-only";
import { importIcloudCalendar } from "@/features/calendar-feed/icloud-server";
import { importExternalEvents } from "@/features/google/server";

/** Importação em andamento por estúdio: o layout do Calendário e a tela do dia podem pedir juntos no mesmo acesso. */
const inflight = new Map<string, Promise<void>>();

/**
 * Traz os compromissos dos calendários de fora (Google e iCloud) como bloqueios antes de a tela calcular o que
 * está ocupado. Os dois em paralelo; cada um já se limita a uma vez a cada 2 min por estúdio e nunca lança erro,
 * então a tela só espera de verdade na primeira abertura do intervalo. Quem chega com uma importação já em
 * andamento espera a mesma (sem isso, o segundo pedido passava direto pelo limite e desenhava sem os eventos novos).
 */
export function syncExternalCalendars(tenantId: string): Promise<void> {
  const running = inflight.get(tenantId);
  if (running) return running;
  const p = Promise.all([importExternalEvents(tenantId), importIcloudCalendar(tenantId)])
    .then(() => undefined)
    .finally(() => inflight.delete(tenantId));
  inflight.set(tenantId, p);
  return p;
}
