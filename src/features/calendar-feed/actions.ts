"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { professionals } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { canAs } from "@/features/team/permissions";
import { calendarProfessionalId } from "@/features/team/professional";
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
  const me = await requireTenant();
  const { tenantId } = me;
  try {
    const professionalId = await calendarProfessionalId(me);
    if (!canAs(me, "calendar.own", professionalId)) return fail("FORBIDDEN");
    const token = newToken();
    await withTenant(tenantId, (tx) =>
      tx
        .update(professionals)
        .set({ calendarTokenHash: hashToken(token), calendarFetchedAt: null })
        .where(eq(professionals.id, professionalId)),
    );
    return ok({ url: `${await baseUrl()}/api/calendar/${token}.ics` });
  } catch {
    return fail("UNKNOWN");
  }
}

export async function disableCalendarLink(): Promise<ActionResult> {
  const me = await requireTenant();
  const { tenantId } = me;
  try {
    const professionalId = await calendarProfessionalId(me);
    if (!canAs(me, "calendar.own", professionalId)) return fail("FORBIDDEN");
    await withTenant(tenantId, (tx) =>
      tx
        .update(professionals)
        .set({ calendarTokenHash: null, calendarFetchedAt: null })
        .where(eq(professionals.id, professionalId)),
    );
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** O iPhone já leu o link? O sheet pergunta enquanto espera a assinatura. */
export async function calendarLinkStatus(): Promise<ActionResult<{ subscribed: boolean }>> {
  const me = await requireTenant();
  const { tenantId } = me;
  try {
    const professionalId = await calendarProfessionalId(me);
    if (!canAs(me, "calendar.own", professionalId)) return fail("FORBIDDEN");
    const [row] = await withTenant(tenantId, (tx) =>
      tx
        .select({ on: professionals.calendarTokenHash, at: professionals.calendarFetchedAt })
        .from(professionals)
        .where(eq(professionals.id, professionalId)),
    );
    return ok({ subscribed: !!row?.on && !!row.at });
  } catch {
    return fail("UNKNOWN");
  }
}

export async function setCalendarHideNames(hide: boolean): Promise<ActionResult> {
  const parsed = z.boolean().safeParse(hide);
  if (!parsed.success) return fail("VALIDATION");
  const me = await requireTenant();
  const { tenantId } = me;
  try {
    const professionalId = await calendarProfessionalId(me);
    if (!canAs(me, "calendar.own", professionalId)) return fail("FORBIDDEN");
    await withTenant(tenantId, (tx) =>
      tx.update(professionals).set({ calendarHideNames: parsed.data }).where(eq(professionals.id, professionalId)),
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
  const me = await requireTenant();
  const { tenantId } = me;
  try {
    const professionalId = await calendarProfessionalId(me);
    if (!canAs(me, "calendar.own", professionalId)) return fail("FORBIDDEN");
    const count = await syncIcloud(tenantId, professionalId, url);
    await withTenant(tenantId, (tx) =>
      tx.update(professionals).set({ icloudCalendarUrl: url }).where(eq(professionals.id, professionalId)),
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
  const me = await requireTenant();
  const { tenantId } = me;
  try {
    const professionalId = await calendarProfessionalId(me);
    if (!canAs(me, "calendar.own", professionalId)) return fail("FORBIDDEN");
    await withTenant(tenantId, async (tx) => {
      await tx.update(professionals).set({ icloudCalendarUrl: null }).where(eq(professionals.id, professionalId));
      await clearIcloudEvents(tx, professionalId);
    });
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    revalidatePath("/vagas");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
