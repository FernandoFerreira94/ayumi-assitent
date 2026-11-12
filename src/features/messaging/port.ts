/** Envio de mensagens de WhatsApp. A implementação real (Evolution) fica atrás desta porta. */
export interface MessagingPort {
  /** Devolve o id da mensagem no WhatsApp (null se o provedor não informar), para o eco do webhook não duplicar. */
  sendText(toE164: string, text: string): Promise<{ id: string | null }>;
}

/** WhatsApp desconectado/credencial inválida: precisa reconectar. */
export class MessagingOfflineError extends Error {}
/** O WhatsApp recusou este envio (ex.: número sem WhatsApp, 400): tentar de novo não adianta. */
export class MessagingRejectedError extends Error {}
/** Falha temporária (rede, 5xx): vale tentar de novo. */
export class MessagingTransientError extends Error {}

/** Motivo curto da falha para log (classe + status). Nunca inclui telefone nem texto da mensagem. */
export const sendFailReason = (e: unknown) =>
  e instanceof MessagingOfflineError
    ? `offline:${e.message}`
    : e instanceof MessagingRejectedError
      ? `rejected:${e.message}`
      : e instanceof MessagingTransientError
        ? `transient:${e.message}`
        : `error:${e instanceof Error ? e.name : typeof e}`;
