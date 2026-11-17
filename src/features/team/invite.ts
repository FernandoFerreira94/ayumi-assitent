import { hashToken, isTokenShape, newToken } from "@/features/calendar-feed/token";
import type { ErrorCode } from "@/lib/errors";

/** Regras puras do convite: o link vale 7 dias e só o hash do token é guardado. */
export const INVITE_TTL_DAYS = 7;
/** Cookie que leva o token do convite pelo login com o Google (httpOnly, vale 1 hora). */
export const INVITE_COOKIE = "bubbly_invite";
export const INVITE_COOKIE_MAX_AGE = 60 * 60;

export { hashToken as hashInviteToken, isTokenShape as isInviteToken, newToken as newInviteToken };

export const inviteExpiresAt = (now: Date) => new Date(now.getTime() + INVITE_TTL_DAYS * 86_400_000);

export type InviteState = "valid" | "expired" | "used" | "invalid";

export function inviteState(row: { expiresAt: Date; usedAt: Date | null } | null, now: Date): InviteState {
  if (!row) return "invalid";
  if (row.usedAt) return "used";
  return row.expiresAt.getTime() <= now.getTime() ? "expired" : "valid";
}

const STATE_ERROR: Record<Exclude<InviteState, "valid">, ErrorCode> = {
  invalid: "INVITE_INVALID",
  expired: "INVITE_EXPIRED",
  used: "INVITE_USED",
};
export const inviteErrorCode = (s: InviteState): ErrorCode | null => (s === "valid" ? null : STATE_ERROR[s]);

export const inviteUrl = (base: string, token: string) => `${base.replace(/\/$/, "")}/convite/${token}`;

/** Mensagem pronta para mandar pelo WhatsApp; `name` é a pessoa convidada, se já se sabe. */
export function inviteMessage(link: string, salon: string, name?: string | null): string {
  const hi = name?.trim() ? `Oi, ${name.trim().split(/\s+/)[0]}!` : "Oi!";
  return `${hi} Te convidei para a agenda do ${salon} no Bubbly. Entre por este link (vale 7 dias): ${link}`;
}

/** Abre o WhatsApp para escolher o contato e enviar (sem número: quem convida escolhe). */
export const inviteWhatsappUrl = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`;
