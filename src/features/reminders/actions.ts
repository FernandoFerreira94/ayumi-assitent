"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { saveMessageSettings } from "./core";
import { TEMPLATE_MAX } from "./text";

const hours = z.coerce.number().int().min(1).max(72);
const template = z.string().trim().max(TEMPLATE_MAX);

/**
 * Cartão "Mensagens no WhatsApp" de Ajustes: como chamar a cliente, texto de agendamento, 1º aviso e 2º aviso
 * opcional (mais perto do horário que o 1º). Texto em branco = volta ao padrão do app.
 */
export async function saveMessages(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const firstOn = fd.get("firstOn") === "1";
  const first = hours.safeParse(fd.get("hours"));
  if (!first.success) return fail("VALIDATION", "hours");
  let secondHours: number | null = null;
  if (fd.get("second") === "1") {
    const second = hours.safeParse(fd.get("secondHours"));
    // Com o 1º ligado, o 2º é o reforço: tem de sair depois dele, ou seja, com menos horas de antecedência
    if (!second.success || (firstOn && second.data >= first.data)) return fail("VALIDATION", "secondHours");
    secondHours = second.data;
  }
  const texts: Record<"bookingTemplate" | "reminderTemplate" | "secondTemplate", string | null> = {
    bookingTemplate: null,
    reminderTemplate: null,
    secondTemplate: null,
  };
  for (const key of Object.keys(texts) as (keyof typeof texts)[]) {
    const p = template.safeParse(fd.get(key) ?? "");
    if (!p.success) return fail("VALIDATION", key);
    texts[key] = p.data || null;
  }
  try {
    await withTenant(tenantId, (tx) =>
      saveMessageSettings(tx, tenantId, {
        first: firstOn,
        hours: first.data,
        secondHours,
        fullName: fd.get("fullName") === "1",
        ...texts,
      }),
    );
    revalidatePath("/ajustes");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
