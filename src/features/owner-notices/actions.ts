"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { sendToAll } from "@/features/push/core";
import { pushFromEnv } from "@/features/push/webpush";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { loadNotice as load, mascotTitle, testNotice } from "./core";
import { mascotsOf } from "./mascots";
import { UF_NAMES } from "./weather";

async function salonOf(tenantId: string) {
  const [s] = await getDb()
    .select({
      name: tenants.name,
      ownerName: tenants.ownerName,
      city: tenants.city,
      state: tenants.state,
      latitude: tenants.latitude,
      longitude: tenants.longitude,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return s ?? null;
}

/** Botão "Enviar aviso de teste" em Ajustes: manda agora o aviso do dia para os aparelhos com aviso ligado. */
export async function sendTestNotice(): Promise<ActionResult<{ sent: number }>> {
  const { tenantId } = await requireTenant();
  const push = pushFromEnv();
  if (!push) return fail("PUSH_NOT_CONFIGURED");
  try {
    const salon = await salonOf(tenantId);
    if (!salon) return fail("UNKNOWN");
    const mascots = await mascotsOf(tenantId).catch(() => ({}) as Record<string, string>);
    const r = await withTenant(tenantId, async (tx) => {
      const t = await testNotice(tx, new Date(), salon);
      return sendToAll(tx, push, (sub) => ({
        ...t,
        title: mascotTitle(t.title, mascots[sub.userId]),
        url: "/agenda",
        tag: "test",
      }));
    });
    if (r.sent === 0) return fail(r.failed ? "PUSH_FAILED" : "PUSH_NO_DEVICE");
    return ok({ sent: r.sent });
  } catch {
    return fail("UNKNOWN");
  }
}

/** Texto completo de um aviso (roteiro da semana, mensagem pronta para as clientes). */
export async function loadNotice(id: string) {
  const { tenantId } = await requireTenant();
  if (!z.uuid().safeParse(id).success) return fail("VALIDATION");
  try {
    const n = await withTenant(tenantId, (tx) => load(tx, id));
    return n ? ok({ ...n, salon: (await salonOf(tenantId))?.name ?? "" }) : fail("NOT_FOUND");
  } catch {
    return fail("UNKNOWN");
  }
}

const deviceInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().trim().max(60).nullable(),
  state: z.string().trim().toUpperCase().nullable(),
});

/**
 * Localização do aparelho (interruptor em Ajustes): coordenadas para a previsão do tempo e cidade/UF (achadas no
 * próprio aparelho) para os feriados locais. Chamado também ao abrir Ajustes, para ficar sempre atualizada.
 */
export async function saveDeviceLocation(
  raw: unknown,
): Promise<ActionResult<{ city: string | null; state: string | null }>> {
  const { tenantId } = await requireTenant();
  const p = deviceInput.safeParse(raw);
  if (!p.success) return fail("VALIDATION");
  const state = p.data.state && p.data.state in UF_NAMES ? p.data.state : null;
  const city = p.data.city || null;
  try {
    await getDb()
      .update(tenants)
      .set({
        latitude: Math.round(p.data.latitude * 1000) / 1000,
        longitude: Math.round(p.data.longitude * 1000) / 1000,
        city,
        state,
        locationSource: "device",
      })
      .where(eq(tenants.id, tenantId));
    return ok({ city, state });
  } catch {
    return fail("UNKNOWN");
  }
}

/** Desliga a localização do aparelho (os avisos seguem, só sem previsão do tempo e feriados da cidade). */
export async function clearLocation(): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  try {
    await getDb()
      .update(tenants)
      .set({ latitude: null, longitude: null, city: null, state: null, locationSource: null })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Interruptor "Bom dia das 8h" em Ajustes > Avisos do dia. */
export async function setGoodMorning(on: unknown): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = z.boolean().safeParse(on);
  if (!p.success) return fail("VALIDATION");
  try {
    await getDb().update(tenants).set({ goodMorning: p.data }).where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
