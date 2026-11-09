"use server";

import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { loadYearDays, type YearDays } from "./data";
import { isYearStr } from "./grid";

/** Ano pedido pelo calendário ao deslizar ou abrir outro ano (o ano atual já vem com a página). */
export async function calendarYear(year: string): Promise<ActionResult<YearDays>> {
  const { tenantId } = await requireTenant();
  if (!isYearStr(year)) return fail("VALIDATION");
  try {
    return ok(await withTenant(tenantId, (tx) => loadYearDays(tx, year)));
  } catch {
    return fail("UNKNOWN");
  }
}
