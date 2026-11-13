import "server-only";
import { importIcloudCalendar } from "@/features/calendar-feed/icloud-server";
import { importExternalEvents } from "@/features/google/server";

/**
 * Traz os compromissos dos calendários de fora (Google e iCloud) como bloqueios antes de a tela calcular o que
 * está ocupado. Os dois em paralelo (antes era um depois do outro); cada um já se limita a uma vez a cada
 * 2 min por estúdio e nunca lança erro, então a tela só espera de verdade na primeira abertura do intervalo.
 */
export async function syncExternalCalendars(tenantId: string): Promise<void> {
  await Promise.all([importExternalEvents(tenantId), importIcloudCalendar(tenantId)]);
}
