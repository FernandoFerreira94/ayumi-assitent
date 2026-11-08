/** Envio de mensagens de WhatsApp. A implementação real (Evolution) fica atrás desta porta. */
export interface MessagingPort {
  /** Devolve o id da mensagem no WhatsApp (null se o provedor não informar), para o eco do webhook não duplicar. */
  sendText(toE164: string, text: string): Promise<{ id: string | null }>;
}

/** WhatsApp desconectado/credencial inválida: precisa reconectar. */
export class MessagingOfflineError extends Error {}
/** Falha temporária (rede, 5xx): vale tentar de novo. */
export class MessagingTransientError extends Error {}
