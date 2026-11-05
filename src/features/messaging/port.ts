/** Envio de mensagens de WhatsApp. A implementação real (Evolution) fica atrás desta porta. */
export interface MessagingPort {
  sendText(toE164: string, text: string): Promise<void>;
}

/** WhatsApp desconectado/credencial inválida: precisa reconectar. */
export class MessagingOfflineError extends Error {}
/** Falha temporária (rede, 5xx): vale tentar de novo. */
export class MessagingTransientError extends Error {}
