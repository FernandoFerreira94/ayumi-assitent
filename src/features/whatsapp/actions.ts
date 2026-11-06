"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { adminFromEnv, WhatsAppAdminError, type WaState } from "@/features/messaging/evolution-admin";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { currentState, startPairing } from "./core";

/** Registra o motivo técnico (sem segredos) para o erro genérico mostrado à usuária ser diagnosticável. */
function logWaError(action: string, e: unknown) {
  console.error(JSON.stringify({ level: "error", msg: "whatsapp_failed", action, err: e instanceof Error ? e.message : String(e) }));
}

async function tenantInstance(tenantId: string): Promise<string | null> {
  const [t] = await getDb().select({ i: tenants.whatsappInstance }).from(tenants).where(eq(tenants.id, tenantId));
  return t?.i ?? null;
}

export async function whatsappStatus(): Promise<ActionResult<{ state: WaState }>> {
  const { tenantId } = await requireTenant();
  const admin = adminFromEnv();
  if (!admin) return fail("WHATSAPP_UNAVAILABLE");
  try {
    return ok({ state: await currentState(admin, await tenantInstance(tenantId)) });
  } catch (e) {
    logWaError("status", e);
    return fail("WHATSAPP_UNAVAILABLE");
  }
}

export async function startWhatsappPairing(phone: string): Promise<ActionResult<{ pairingCode: string }>> {
  const { tenantId } = await requireTenant();
  const admin = adminFromEnv();
  if (!admin) return fail("WHATSAPP_UNAVAILABLE");
  try {
    const r = await startPairing(admin, tenantId, String(phone ?? ""));
    if (!r.ok) return fail("VALIDATION", "phone");
    await getDb().update(tenants).set({ whatsappInstance: r.instance }).where(eq(tenants.id, tenantId));
    return ok({ pairingCode: r.pairingCode });
  } catch (e) {
    logWaError("pairing", e);
    return fail(e instanceof WhatsAppAdminError ? "WHATSAPP_UNAVAILABLE" : "UNKNOWN");
  }
}

export async function disconnectWhatsapp(): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const admin = adminFromEnv();
  if (!admin) return fail("WHATSAPP_UNAVAILABLE");
  try {
    const instance = await tenantInstance(tenantId);
    if (instance) await admin.logout(instance);
    revalidatePath("/ajustes");
    return ok();
  } catch (e) {
    logWaError("disconnect", e);
    return fail("WHATSAPP_UNAVAILABLE");
  }
}
