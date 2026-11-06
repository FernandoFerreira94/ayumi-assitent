import { toE164 } from "@/lib/phone";
import type { WaState, WhatsAppAdmin } from "@/features/messaging/evolution-admin";

/** Nome da instância deste estúdio na Evolution: estável e único. */
export const instanceName = (tenantId: string) => `studio-${tenantId.replace(/-/g, "").slice(0, 16)}`;

export type PairResult = { ok: true; instance: string; pairingCode: string } | { ok: false; reason: "phone" };

/** Cria a instância (se preciso) e devolve o código de pareamento para o número informado. */
export async function startPairing(admin: WhatsAppAdmin, tenantId: string, phoneRaw: string): Promise<PairResult> {
  const phone = toE164(phoneRaw);
  if (!phone) return { ok: false, reason: "phone" };
  const instance = instanceName(tenantId);
  await admin.create(instance);
  const { pairingCode } = await admin.pair(instance, phone);
  return { ok: true, instance, pairingCode };
}

export async function currentState(admin: WhatsAppAdmin, instance: string | null): Promise<WaState> {
  return instance ? admin.state(instance) : "none";
}
