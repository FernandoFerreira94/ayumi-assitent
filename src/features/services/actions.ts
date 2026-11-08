"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { insertService, setServiceActive as setActive, updateService } from "./core";
import { serviceInput } from "./schema";

// Toda tela que lista serviços
const revalidate = () => {
  for (const p of ["/servicos", "/ajustes", "/agenda", "/vagas"]) revalidatePath(p);
};

const parse = (formData: FormData) =>
  serviceInput.safeParse({
    name: formData.get("name") ?? "",
    durationMin: formData.get("durationMin") ?? "",
    price: formData.get("price") ?? "",
  });

export async function createService(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const parsed = parse(formData);
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    await withTenant(tenantId, (tx) => insertService(tx, tenantId, parsed.data));
    revalidate();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function editService(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = parse(formData);
  if (!id.success) return fail("NOT_ALLOWED");
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  try {
    const found = await withTenant(tenantId, (tx) => updateService(tx, id.data, parsed.data));
    if (!found) return fail("NOT_ALLOWED");
    revalidate();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function setServiceActive(id: string, active: boolean): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  if (!z.string().uuid().safeParse(id).success) return fail("NOT_ALLOWED");
  try {
    const found = await withTenant(tenantId, (tx) => setActive(tx, id, active));
    if (!found) return fail("NOT_ALLOWED");
    revalidate();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
