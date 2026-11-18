import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Link do convite que vai na mensagem de agendamento: estúdio + agendamento + assinatura, num token só.
 * Sem nome nem telefone; sem o BETTER_AUTH_SECRET não há como montar o link de outro agendamento.
 */
const SIG_BYTES = 12;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toBytes = (uuid: string) => Buffer.from(uuid.replace(/-/g, ""), "hex");
const toUuid = (b: Buffer) => {
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const sign = (ids: Buffer, secret: string) =>
  createHmac("sha256", secret).update("appointment-invite:").update(ids).digest().subarray(0, SIG_BYTES);

export function inviteToken(tenantId: string, appointmentId: string, env = process.env): string | null {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret || !UUID.test(tenantId) || !UUID.test(appointmentId)) return null;
  const ids = Buffer.concat([toBytes(tenantId), toBytes(appointmentId)]);
  return Buffer.concat([ids, sign(ids, secret)]).toString("base64url");
}

/** Ids do token, ou null se a assinatura não bate (a rota responde igual para todo token inválido). */
export function readInviteToken(token: string, env = process.env): { tenantId: string; appointmentId: string } | null {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret || !/^[A-Za-z0-9_-]{59}$/.test(token)) return null;
  const raw = Buffer.from(token, "base64url");
  if (raw.length !== 32 + SIG_BYTES) return null;
  const ids = raw.subarray(0, 32);
  if (!timingSafeEqual(raw.subarray(32), sign(ids, secret))) return null;
  return { tenantId: toUuid(ids.subarray(0, 16)), appointmentId: toUuid(ids.subarray(16)) };
}

/** URL pública do convite (.ics); null sem URL pública ou segredo, e a mensagem sai sem o link. */
export function inviteUrl(tenantId: string, appointmentId: string, env = process.env): string | null {
  const base = env.BETTER_AUTH_URL?.replace(/\/$/, "");
  const t = inviteToken(tenantId, appointmentId, env);
  return base && t ? `${base}/api/agenda/convite/${t}.ics` : null;
}
