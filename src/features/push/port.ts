export type PushSub = { endpoint: string; p256dh: string; auth: string };
/** Inscrição com o dono: o envio usa userId/tenantId para pôr o emoji do mascote da pessoa no título. */
export type PushTarget = PushSub & { userId?: string; tenantId?: string };
export type PushPayload = {
  title: string;
  body: string;
  url: string;
  /** Mesma tag = o aviso novo substitui o anterior na tela bloqueada, em vez de empilhar */
  tag?: string;
};

/** Falha permanente (inscrição expirada/removida): deve ser apagada. */
export class PushGoneError extends Error {}

export interface PushPort {
  send(sub: PushTarget, payload: PushPayload): Promise<void>;
}
