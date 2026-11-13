"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { normalizeIcloudUrl } from "./icloud";
import { clearIcloudEvents } from "./icloud-import";
import { IcloudFetchError, resetIcloudThrottle, syncIcloud } from "./icloud-server";
import { hashToken, newToken } from "./token";

async function baseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

/** Gera o link (ou troca por um novo: o antigo para na hora). O link só é mostrado agora. */
export async function createCalendarLink(): Promise<ActionResult<{ url: string }>> {
  const { tenantId } = await requireTenant();
  try {
    const token = newToken();
    await withTenant(tenantId, (tx) =>
      tx
        .update(tenants)
        .set({ calendarTokenHash: hashToken(token) })
        .where(eq(tenants.id, tenantId)),
    );
    return ok({ url: `${await baseUrl()}/api/calendar/${token}.ics` });
  } catch {
    return fail("UNKNOWN");
  }
}

export async function disableCalendarLink(): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  try {
    await withTenant(tenantId, (tx) =>
      tx.update(tenants).set({ calendarTokenHash: null }).where(eq(tenants.id, tenantId)),
    );
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function setCalendarHideNames(hide: boolean): Promise<ActionResult> {
  const parsed = z.boolean().safeParse(hide);
  if (!parsed.success) return fail("VALIDATION");
  const { tenantId } = await requireTenant();
  try {
    await withTenant(tenantId, (tx) =>
      tx.update(tenants).set({ calendarHideNames: parsed.data }).where(eq(tenants.id, tenantId)),
    );
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

const ICLOUD_ERR = {
  not_found: "ICLOUD_NOT_FOUND",
  failed: "ICLOUD_FAILED",
  too_big: "ICLOUD_TOO_BIG",
  not_calendar: "ICLOUD_LINK_INVALID",
} as const;

/** Liga a leitura do Calendário do iPhone: valida o link, lê uma vez (se falhar, não salva) e grava. */
export async function saveIcloudCalendar(raw: string): Promise<ActionResult<{ count: number }>> {
  const p = z.string().max(1000).safeParse(raw);
  const url = p.success ? normalizeIcloudUrl(p.data) : null;
  if (!url) return fail("ICLOUD_LINK_INVALID", "url");
  const { tenantId } = await requireTenant();
  try {
    const count = await syncIcloud(tenantId, url);
    await withTenant(tenantId, (tx) =>
      tx.update(tenants).set({ icloudCalendarUrl: url }).where(eq(tenants.id, tenantId)),
    );
    resetIcloudThrottle(tenantId);
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    revalidatePath("/vagas");
    return ok({ count });
  } catch (e) {
    return fail(e instanceof IcloudFetchError ? ICLOUD_ERR[e.kind] : "UNKNOWN");
  }
}

/** Para de ler o Calendário do iPhone e tira da agenda o que veio de lá. */
export async function removeIcloudCalendar(): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  try {
    await withTenant(tenantId, async (tx) => {
      await tx.update(tenants).set({ icloudCalendarUrl: null }).where(eq(tenants.id, tenantId));
      await clearIcloudEvents(tx);
    });
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    revalidatePath("/vagas");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
