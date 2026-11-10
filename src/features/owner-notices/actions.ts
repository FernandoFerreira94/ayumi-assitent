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
import { loadNotice as load, testNotice } from "./core";
import { geocodeCity, UF_NAMES } from "./weather";

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
    const r = await withTenant(tenantId, async (tx) => {
      const t = await testNotice(tx, new Date(), salon);
      return sendToAll(tx, push, { ...t, url: "/agenda", tag: "test" });
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

const locationInput = z.object({
  city: z.string().trim().min(2, "Informe a cidade").max(60),
  state: z.enum(Object.keys(UF_NAMES) as [string, ...string[]], "Escolha a UF"),
});

/** Cidade e UF do salão: feriados locais e previsão do tempo dos avisos. */
export async function saveLocation(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = locationInput.safeParse({ city: form.get("city") ?? "", state: form.get("state") ?? "" });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  const coords = await geocodeCity(p.data.city, p.data.state);
  if (!coords) return fail("CITY_NOT_FOUND", "city");
  try {
    await getDb()
      .update(tenants)
      .set({ city: p.data.city, state: p.data.state, latitude: coords.latitude, longitude: coords.longitude })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
