"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { listDay } from "@/features/appointments/core";
import { listBlocks } from "@/features/blocks/core";
import { listBookable } from "@/features/services/core";
import { dayRange, todayStr } from "@/lib/dates";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { getHours } from "./core";
import { customConfigSchema, filterDaySlots, resolveDates, shortDayLabel, type CustomDay } from "./custom-slots";
import { removeSlotList, saveSlotList } from "./slot-lists";
import { freeSlots, weekdayOf } from "./slots";

export type CustomResult = { serviceId: string; serviceName: string; days: CustomDay[] };

/** Vagas reais da agenda no período e filtros escolhidos (atendimentos, bloqueios, pausa e expediente já descontados). */
export async function computeCustomSlots(raw: unknown): Promise<ActionResult<CustomResult>> {
  const { tenantId } = await requireTenant();
  const parsed = customConfigSchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION");
  const config = parsed.data;
  const today = todayStr();
  const now = new Date();
  const dates = resolveDates(config.period, today).filter(
    (d) => !config.weekdays.length || config.weekdays.includes(weekdayOf(d)),
  );
  try {
    return await withTenant(tenantId, async (tx) => {
      const services = (await listBookable(tx)).filter((x) => x.showInSlots);
      const service = services.find((x) => x.id === config.serviceId) ?? services[0];
      if (!service) return fail("NOT_FOUND");
      if (dates.length === 0) return ok({ serviceId: service.id, serviceName: service.name, days: [] });
      const range: [Date, Date] = [dayRange(dates[0])[0], dayRange(dates[dates.length - 1])[1]];
      const [appts, blks, week] = await Promise.all([listDay(tx, range), listBlocks(tx, range), getHours(tx)]);
      const busy = [...appts.map((a) => ({ startsAt: a.startsAt, endsAt: a.blockedUntil })), ...blks];
      const days: CustomDay[] = dates.flatMap((date) => {
        const free = freeSlots({
          date,
          day: week[weekdayOf(date)],
          durationMin: service.durationMin + service.bufferMin,
          busy,
          notBefore: date === today ? now : undefined,
        });
        const slots = filterDaySlots(date, free, config);
        return slots.length ? [{ date, label: shortDayLabel(date), slots }] : [];
      });
      return ok({ serviceId: service.id, serviceName: service.name, days });
    });
  } catch {
    return fail("UNKNOWN");
  }
}

const saveInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(40),
  config: customConfigSchema,
});

export async function saveCustomList(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireTenant();
  const parsed = saveInput.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "name");
  try {
    const res = await withTenant(tenantId, (tx) => saveSlotList(tx, tenantId, parsed.data));
    if (res.status !== "ok") {
      return res.status === "taken" ? fail("NAME_TAKEN", "name") : fail("NOT_FOUND");
    }
    revalidatePath("/vagas");
    return ok({ id: res.id });
  } catch {
    return fail("UNKNOWN");
  }
}

export async function deleteCustomList(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = z.string().uuid().safeParse(id);
  if (!p.success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) => removeSlotList(tx, p.data));
    revalidatePath("/vagas");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
