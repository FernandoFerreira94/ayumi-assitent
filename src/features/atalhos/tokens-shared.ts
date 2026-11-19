/** Até quantas chaves ligadas por estúdio (um iPhone e um iPad sobram). */
export const MAX_ACTIVE_TOKENS = 3;

export type TokenItem = { id: string; name: string; last4: string; createdAt: string; lastUsedAt: string | null };

/** Nome do Atalho pronto (link do iCloud). É o que a pessoa fala: "E aí Siri, Bubbly". */
export const SHORTCUT_NAME = "Bubbly";
/** Frases do menu do Atalho (a Siri lê as opções e a pessoa responde falando). */
export const SHORTCUT_MENU = ["Agenda de hoje", "Próxima cliente", "Resumo do dia", "Agenda de amanhã"] as const;
/** Só aceita link de Atalho do iCloud (o valor vem da variável SIRI_SHORTCUT_URL). */
export const isShortcutLink = (v: string | undefined): v is string =>
  !!v && /^https:\/\/www\.icloud\.com\/shortcuts\/[A-Za-z0-9]{16,64}$/.test(v);
