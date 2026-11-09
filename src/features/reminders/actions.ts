"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { saveReminderConfig } from "./core";

const hours = z.coerce.number().int().min(1).max(72);

/** 1º aviso, 2º aviso opcional (mais perto do horário que o 1º) e valor na mensagem de agendamento. */
export async function saveReminderSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const first = hours.safeParse(fd.get("hours"));
  if (!first.success) return fail("VALIDATION", "hours");
  let secondHours: number | null = null;
  if (fd.get("second") === "1") {
    const second = hours.safeParse(fd.get("secondHours"));
    // O 2º aviso é o reforço: tem de sair depois do 1º, ou seja, com menos horas de antecedência
    if (!second.success || second.data >= first.data) return fail("VALIDATION", "secondHours");
    secondHours = second.data;
  }
  try {
    await withTenant(tenantId, (tx) =>
      saveReminderConfig(tx, tenantId, {
        hours: first.data,
        secondHours,
        includePrice: fd.get("includePrice") === "1",
      }),
    );
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
