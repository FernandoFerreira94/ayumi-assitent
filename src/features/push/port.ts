export type PushSub = { endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url: string };

/** Falha permanente (inscrição expirada/removida): deve ser apagada. */
export class PushGoneError extends Error {}

export interface PushPort {
  send(sub: PushSub, payload: PushPayload): Promise<void>;
}
