"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { saveHours } from "./core";
import type { Day } from "./slots";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveWorkingHours(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const week: Day[] = [];
  for (let i = 0; i < 7; i++) {
    if (fd.get(`open-${i}`) !== "on") {
      week.push(null);
      continue;
    }
    const opens = String(fd.get(`opens-${i}`) ?? "");
    const closes = String(fd.get(`closes-${i}`) ?? "");
    if (!HHMM.test(opens) || !HHMM.test(closes) || closes <= opens) return fail("VALIDATION", String(i));
    week.push({ opens, closes });
  }
  try {
    await withTenant(tenantId, (tx) => saveHours(tx, tenantId, week));
    revalidatePath("/ajustes");
    revalidatePath("/vagas");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
