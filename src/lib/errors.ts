/** Catálogo único de erros: código → texto em português para a usuária. */
export const ERROR_MESSAGES = {
  SLOT_TAKEN: "Esse horário acabou de ser ocupado. Escolha outro.",
  HAS_APPOINTMENTS: "Há agendamentos nesse período. Cancele ou reagende antes de bloquear.",
  PHONE_EXISTS: "Este número já é de outra cliente.",
  GOOGLE_EXPIRED: "O acesso ao Google expirou. Reconecte para sincronizar.",
  WHATSAPP_UNAVAILABLE: "Não conseguimos falar com o WhatsApp agora. Tente de novo em instantes.",
  WHATSAPP_INVALID_NUMBER: "O WhatsApp não aceitou este número. Confira o telefone da cliente.",
  WHATSAPP_OFFLINE: "O WhatsApp está desconectado. Reconecte para enviar mensagens.",
  NAME_TAKEN: "Já existe um com esse nome aqui. Escolha outro.",
  CATEGORY_NOT_EMPTY: "Mova ou exclua os serviços antes de excluir a categoria.",
  IMAGE_TOO_LARGE: "A imagem é grande demais. Tente uma foto menor.",
  NOT_ALLOWED: "Esta conta não tem acesso.",
  VALIDATION: "Confira os campos destacados.",
  NOT_FOUND: "Não encontramos esse item. Ele pode ter sido apagado.",
  CITY_NOT_FOUND: "Não encontramos essa cidade. Confira o nome e a UF.",
  PUSH_NOT_CONFIGURED: "Os avisos no celular ainda não estão configurados no servidor.",
  PUSH_NO_DEVICE: "Nenhum aparelho com aviso ligado. Ligue a Notificação em Ajustes > Notificações primeiro.",
  PUSH_FAILED: "O aviso não chegou ao aparelho. Desative e ative os avisos de novo e tente outra vez.",
  ICLOUD_LINK_INVALID:
    "Esse não é um link de Calendário Público do iCloud. Copie de novo pelo botão Compartilhar Link.",
  ICLOUD_NOT_FOUND: "O iCloud não achou esse calendário. Confira se o Calendário Público continua ligado no iPhone.",
  ICLOUD_FAILED: "Não conseguimos ler o calendário do iPhone agora. Tente de novo em instantes.",
  ICLOUD_TOO_BIG: "Esse calendário tem eventos demais. Use um calendário só para a agenda do salão.",
  API_TOKEN_LIMIT: "Você já tem 3 chaves ligadas. Desligue uma antes de criar outra.",
  CLIPBOARD: "Não deu para copiar. Segure o texto e escolha Copiar.",
  SUPPORT_RATE_LIMITED: "Você mandou muitas mensagens seguidas. Espere um pouco que a gente já responde.",
  RATE_LIMITED: "Você enviou muitas mensagens hoje. Tente de novo amanhã.",
  ADMIN_STEP_UP_INVALID: "Código inválido. Confira o app autenticador e tente de novo.",
  ADMIN_STEP_UP_LOCKED: "Muitas tentativas. Espere 15 minutos para tentar de novo.",
  ADMIN_PASSWORD_REQUIRED: "Digite a senha da sua conta para continuar.",
  RESET_LINK_INVALID: "Este link de nova senha expirou ou já foi usado. Peça um novo na tela de entrar.",
  ADMIN_STEP_UP_BUSY: "Outra tentativa ainda está em andamento. Tente de novo em instantes.",
  NETWORK: "Sem conexão. Verifique a internet e tente de novo.",
  UNKNOWN: "Algo deu errado do nosso lado. Tente de novo em instantes.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; code: ErrorCode; field?: string };

export const ok = <T = void>(data?: T): ActionResult<T> => ({ ok: true, data: data as T });
export const fail = (code: ErrorCode, field?: string): ActionResult<never> => ({ ok: false, code, field });

export const messageFor = (code: ErrorCode | undefined): string =>
  ERROR_MESSAGES[code ?? "UNKNOWN"] ?? ERROR_MESSAGES.UNKNOWN;
