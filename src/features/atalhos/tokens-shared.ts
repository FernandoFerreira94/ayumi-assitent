/** Até quantas chaves ligadas por estúdio (um iPhone e um iPad sobram). */
export const MAX_ACTIVE_TOKENS = 3;

export type TokenItem = { id: string; name: string; last4: string; createdAt: string; lastUsedAt: string | null };
