/**
 * Regra da falta: só dá para marcar "Faltou" depois que o horário de início do atendimento passou.
 * Puro (sem banco) para a tela e o servidor usarem a mesma conta.
 */
export const canMarkNoShow = (startsAt: Date, now: Date = new Date()) => startsAt.getTime() <= now.getTime();

/** Dica do botão desligado: "Disponível a partir das 21:00". */
export const noShowHint = (startHHMM: string) => `Disponível a partir das ${startHHMM}`;
