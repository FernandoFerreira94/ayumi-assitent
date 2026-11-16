"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { canAs, ownAgendaId } from "@/features/team/permissions";
import { saveHours } from "./core";
import type { Day } from "./slots";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveWorkingHours(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const me = await requireTenant();
  const { tenantId } = me;
  // Profissional edita o próprio expediente; dona e gerente, o da profissional padrão (como sempre)
  const professionalId = ownAgendaId(me);
  if (!canAs(me, "agenda.edit", professionalId)) return fail("FORBIDDEN");
  // Pausa única para todos os dias abertos (o banco guarda por dia, para no futuro variar)
  const pauseOn = fd.get("break-on") === "on";
  const breakStart = String(fd.get("break-start") ?? "");
  const breakEnd = String(fd.get("break-end") ?? "");
  if (pauseOn && (!HHMM.test(breakStart) || !HHMM.test(breakEnd) || breakEnd <= breakStart))
    return fail("VALIDATION", "break");
  const week: Day[] = [];
  for (let i = 0; i < 7; i++) {
    if (fd.get(`open-${i}`) !== "on") {
      week.push(null);
      continue;
    }
    const opens = String(fd.get(`opens-${i}`) ?? "");
    const closes = String(fd.get(`closes-${i}`) ?? "");
    if (!HHMM.test(opens) || !HHMM.test(closes) || closes <= opens) return fail("VALIDATION", String(i));
    // Pausa fora do expediente desse dia é ignorada nele (ex.: sábado que fecha 12:00)
    const fits = pauseOn && breakStart >= opens && breakEnd <= closes;
    week.push({ opens, closes, breakStart: fits ? breakStart : null, breakEnd: fits ? breakEnd : null });
  }
  try {
    await withTenant(tenantId, (tx) => saveHours(tx, tenantId, week, professionalId));
    revalidatePath("/ajustes", "layout");
    revalidatePath("/vagas");
    revalidatePath("/agenda");
    revalidatePath("/calendario");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
