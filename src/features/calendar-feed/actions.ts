"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
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
