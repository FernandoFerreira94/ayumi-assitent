"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { icloudCalendars, tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { normalizeIcloudUrl } from "./icloud";
import { clearIcloudEvents, clearOrphanIcloudEvents } from "./icloud-import";
import { IcloudFetchError, readIcloud, resetIcloudThrottle, storeIcloudRead } from "./icloud-server";
import type { IcloudCalendarView } from "./icloud-view";
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
        .set({ calendarTokenHash: hashToken(token), calendarFetchedAt: null })
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
      tx.update(tenants).set({ calendarTokenHash: null, calendarFetchedAt: null }).where(eq(tenants.id, tenantId)),
    );
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** O iPhone já leu o link? O sheet pergunta enquanto espera a assinatura. */
export async function calendarLinkStatus(): Promise<ActionResult<{ subscribed: boolean }>> {
  const { tenantId } = await requireTenant();
  try {
    const [row] = await withTenant(tenantId, (tx) =>
      tx
        .select({ on: tenants.calendarTokenHash, at: tenants.calendarFetchedAt })
        .from(tenants)
        .where(eq(tenants.id, tenantId)),
    );
    return ok({ subscribed: !!row?.on && !!row.at });
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

/** Quantos calendários do iCloud um estúdio pode ligar (Pessoal, Trabalho, …). */
const ICLOUD_MAX = 10;

/**
 * Liga mais um calendário do iPhone: valida o link, lê uma vez (se falhar, não salva) e grava.
 * O mesmo link de novo só lê de novo. Devolve o nome lido do calendário e quantos eventos vieram.
 */
export async function saveIcloudCalendar(raw: string): Promise<ActionResult<IcloudCalendarView>> {
  const p = z.string().max(1000).safeParse(raw);
  const url = p.success ? normalizeIcloudUrl(p.data) : null;
  if (!url) return fail("ICLOUD_LINK_INVALID", "url");
  const { tenantId } = await requireTenant();
  try {
    const read = await readIcloud(url);
    const view = await withTenant(tenantId, async (tx) => {
      const existing = await tx.select({ id: icloudCalendars.id, url: icloudCalendars.url }).from(icloudCalendars);
      const same = existing.find((c) => c.url === url);
      if (!same && existing.length >= ICLOUD_MAX) return null;
      const id =
        same?.id ??
        (await tx.insert(icloudCalendars).values({ tenantId, url }).returning({ id: icloudCalendars.id }))[0].id;
      const count = await storeIcloudRead(tx, tenantId, id, read);
      return { id, name: read.name, eventCount: count, syncedAt: new Date().toISOString(), syncError: null };
    });
    if (!view) return fail("ICLOUD_LIMIT");
    resetIcloudThrottle(tenantId);
    revalidateAgenda();
    return ok(view);
  } catch (e) {
    return fail(e instanceof IcloudFetchError ? ICLOUD_ERR[e.kind] : "UNKNOWN");
  }
}

/** Para de ler um calendário do iPhone (ou todos, sem `id`) e tira da agenda o que veio dele. */
export async function removeIcloudCalendar(id?: string): Promise<ActionResult> {
  const p = z.string().uuid().optional().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  const { tenantId } = await requireTenant();
  try {
    await withTenant(tenantId, async (tx) => {
      if (p.data) {
        // o cascade de blocks.icloud_calendar_id tira os eventos dele
        await tx.delete(icloudCalendars).where(eq(icloudCalendars.id, p.data));
        await clearOrphanIcloudEvents(tx);
      } else {
        await tx.delete(icloudCalendars);
        await clearIcloudEvents(tx);
      }
    });
    revalidateAgenda();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

function revalidateAgenda() {
  revalidatePath("/agenda");
  revalidatePath("/calendario");
  revalidatePath("/vagas");
}
