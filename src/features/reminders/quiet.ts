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

/** Primeiro instante em que algo automático pode sair: o próprio `t` ou, no silêncio, as 6h seguintes. */
export function nextSendable(t: Date): Date {
  if (!isQuietHour(t)) return t;
  const local = new Date(t.getTime() - 3 * 3600_000);
  const six = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), QUIET_UNTIL_HOUR + 3);
  return new Date(local.getUTCHours() >= QUIET_FROM_HOUR ? six + 86_400_000 : six);
}
