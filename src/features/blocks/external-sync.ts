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

/** Último "Atualizar" pedido à mão, por estúdio: segura toques repetidos sem bater no Google/iCloud a cada um. */
const lastManual = new Map<string, number>();
const MANUAL_MIN_MS = 15_000;

/**
 * Botão "Atualizar" do Calendário e do Painel: traz os calendários de fora agora, sem esperar os 2 min.
 * Toques seguidos dentro de 15 s caem no fluxo normal (que reaproveita a importação em andamento). Nunca lança.
 */
export function forceSyncExternalCalendars(tenantId: string): Promise<void> {
  const running = inflight.get(tenantId);
  if (running) return running;
  const now = Date.now();
  if (now - (lastManual.get(tenantId) ?? 0) < MANUAL_MIN_MS) return syncExternalCalendars(tenantId);
  lastManual.set(tenantId, now);
  const p = Promise.all([importExternalEvents(tenantId, true), importIcloudCalendar(tenantId, true)])
    .then(() => undefined)
    .finally(() => inflight.delete(tenantId));
  inflight.set(tenantId, p);
  return p;
}
