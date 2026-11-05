"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { syncAppointmentSafe } from "@/features/google/server";
import type { SyncResult } from "@/features/google/sync";
import { insertAppointment, setStatus } from "./core";
import { appointmentInput, STATUSES } from "./schema";

export async function createAppointment(_prev: ActionResult<{ id: string }> | null, formData: FormData) {
  const { tenantId } = await requireTenant();
  const parsed = appointmentInput.safeParse({
    clientId: formData.get("clientId") ?? "",
    serviceId: formData.get("serviceId") ?? "",
    date: formData.get("date") ?? "",
    time: formData.get("time") ?? "",
  });
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const res = await withTenant(tenantId, (tx) => insertAppointment(tx, tenantId, parsed.data));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    const sync = await syncAppointmentSafe(tenantId, res.data.id);
    return ok({ id: res.data.id, sync });
  } catch {
    return fail("UNKNOWN");
  }
}

export async function updateStatus(id: string, status: string): Promise<ActionResult<{ sync: SyncResult }>> {
  const { tenantId } = await requireTenant();
  const p = z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).safeParse({ id, status });
  if (!p.success) return fail("VALIDATION");
  try {
    const res = await withTenant(tenantId, (tx) => setStatus(tx, p.data.id, p.data.status));
    if (!res.ok) return res;
    revalidatePath("/agenda");
    return ok({ sync: await syncAppointmentSafe(tenantId, p.data.id) });
  } catch {
    return fail("UNKNOWN");
  }
}
