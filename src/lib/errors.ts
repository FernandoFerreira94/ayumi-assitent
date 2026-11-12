/** Catálogo único de erros: código → texto em português para a usuária. */
export const ERROR_MESSAGES = {
  SLOT_TAKEN: "Esse horário acabou de ser ocupado. Escolha outro.",
  HAS_APPOINTMENTS: "Há agendamentos nesse período. Cancele ou reagende antes de bloquear.",
  CLIENT_HAS_APPOINTMENTS: "Esta cliente tem agendamentos. Cancele ou apague os horários dela antes de excluir.",
  PHONE_EXISTS: "Este número já é de outra cliente.",
  GOOGLE_EXPIRED: "O acesso ao Google expirou. Reconecte para sincronizar.",
  WHATSAPP_UNAVAILABLE: "Não conseguimos falar com o WhatsApp agora. Tente de novo em instantes.",
  WHATSAPP_OFFLINE: "O WhatsApp está desconectado. Reconecte para enviar mensagens.",
  NAME_TAKEN: "Já existe um com esse nome aqui. Escolha outro.",
  CATEGORY_NOT_EMPTY: "Mova ou exclua os serviços antes de excluir a categoria.",
  IMAGE_TOO_LARGE: "A imagem é grande demais. Tente uma foto menor.",
  NOT_ALLOWED: "Esta conta não tem acesso.",
  VALIDATION: "Confira os campos destacados.",
  NOT_FOUND: "Não encontramos esse item. Ele pode ter sido apagado.",
  CITY_NOT_FOUND: "Não encontramos essa cidade. Confira o nome e a UF.",
  PUSH_NOT_CONFIGURED: "Os avisos no celular ainda não estão configurados no servidor.",
  PUSH_NO_DEVICE: "Nenhum aparelho com aviso ligado. Toque em Ativar em Avisos no celular primeiro.",
  PUSH_FAILED: "O aviso não chegou ao aparelho. Desative e ative os avisos de novo e tente outra vez.",
  CLIPBOARD: "Não deu para copiar. Segure o texto e escolha Copiar.",
  NETWORK: "Sem conexão. Verifique a internet e tente de novo.",
  UNKNOWN: "Algo deu errado do nosso lado. Tente de novo em instantes.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; code: ErrorCode; field?: string };

export const ok = <T = void>(data?: T): ActionResult<T> => ({ ok: true, data: data as T });
export const fail = (code: ErrorCode, field?: string): ActionResult<never> => ({ ok: false, code, field });

export const messageFor = (code: ErrorCode | undefined): string =>
  ERROR_MESSAGES[code ?? "UNKNOWN"] ?? ERROR_MESSAGES.UNKNOWN;
