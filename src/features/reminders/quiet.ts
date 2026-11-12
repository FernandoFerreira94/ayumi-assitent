/**
 * Horário em que nada automático sai pelo WhatsApp para a cliente: 1º aviso, 2º aviso e respostas automáticas
 * (fuso de Brasília, UTC-3 fixo). O que cair aqui sai às 6h. Mensagem manual da dona sempre pode.
 */
export const QUIET_FROM_HOUR = 21;
export const QUIET_UNTIL_HOUR = 6;

export function isQuietHour(now: Date): boolean {
  const h = (now.getUTCHours() + 24 - 3) % 24;
  return h >= QUIET_FROM_HOUR || h < QUIET_UNTIL_HOUR;
}
