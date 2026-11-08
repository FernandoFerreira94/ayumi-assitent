"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { nameTaken, normalizeName } from "./catalog";
import {
  deleteCategory as removeCategory,
  duplicateService as copyService,
  insertCategory,
  insertService,
  listCategories,
  listServices,
  renameCategory as setCategoryName,
  reorderServices as saveOrder,
  setServiceActive as setActive,
  updateService,
} from "./core";
import { categoryName, serviceInput } from "./schema";

// Toda tela que lista serviços
const revalidate = () => {
  for (const p of ["/servicos", "/ajustes", "/agenda", "/vagas"]) revalidatePath(p);
};

const uuid = z.string().uuid();

const parse = (formData: FormData) =>
  serviceInput.safeParse({
    name: formData.get("name") ?? "",
    categoryId: formData.get("categoryId"),
    durationMin: formData.get("durationMin") ?? "",
    price: formData.get("price") ?? "",
    priceFrom: formData.get("priceFrom"),
    bufferMin: formData.get("bufferMin") ?? "0",
    color: formData.get("color") ?? "lav",
    notes: formData.get("notes"),
    bookable: formData.get("bookable"),
    showInSlots: formData.get("showInSlots"),
  });

/** Cria (sem `id`) ou edita (com `id`). Nome repetido na mesma categoria volta como erro do campo. */
export async function saveService(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const rawId = formData.get("id");
  const id = rawId ? uuid.safeParse(rawId) : null;
  if (id && !id.success) return fail("NOT_ALLOWED");
  const parsed = parse(formData);
  if (!parsed.success) return fail("VALIDATION", String(parsed.error.issues[0]?.path[0] ?? ""));
  const input = parsed.data;
  try {
    const res = await withTenant(tenantId, async (tx) => {
      if (nameTaken(await listServices(tx), input.name, input.categoryId, id?.data)) return "taken" as const;
      if (!id) return (await insertService(tx, tenantId, input)) ? "ok" : "missing";
      return (await updateService(tx, id.data, input)) ? "ok" : "missing";
    });
    if (res === "taken") return fail("NAME_TAKEN", "name");
    if (res === "missing") return fail("NOT_ALLOWED");
    revalidate();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function duplicateService(id: string): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireTenant();
  if (!uuid.safeParse(id).success) return fail("NOT_ALLOWED");
  try {
    const row = await withTenant(tenantId, (tx) => copyService(tx, tenantId, id));
    if (!row) return fail("NOT_ALLOWED");
    revalidate();
    return ok({ id: row.id });
  } catch {
    return fail("UNKNOWN");
  }
}

/** `false` exclui (arquiva), `true` desfaz. */
export async function setServiceActive(id: string, active: boolean): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  if (!uuid.safeParse(id).success) return fail("NOT_ALLOWED");
  try {
    const found = await withTenant(tenantId, (tx) => setActive(tx, id, active));
    if (!found) return fail("NOT_ALLOWED");
    revalidate();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

export async function reorderServices(ids: string[]): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const parsed = z.array(uuid).max(500).safeParse(ids);
  if (!parsed.success) return fail("VALIDATION");
  try {
    await withTenant(tenantId, (tx) => saveOrder(tx, parsed.data));
    revalidate();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}

/** Cria (sem `id`) ou renomeia (com `id`) uma categoria. */
export async function saveCategory(name: string, id?: string): Promise<ActionResult<{ id: string; name: string }>> {
  const { tenantId } = await requireTenant();
  const parsed = categoryName.safeParse(name);
  if (!parsed.success) return fail("VALIDATION", "name");
  if (id && !uuid.safeParse(id).success) return fail("NOT_ALLOWED");
  try {
    const res = await withTenant(tenantId, async (tx) => {
      const cats = await listCategories(tx);
      if (cats.some((c) => c.id !== id && normalizeName(c.name) === normalizeName(parsed.data))) return "taken" as const;
      if (!id) return insertCategory(tx, tenantId, parsed.data);
      return (await setCategoryName(tx, id, parsed.data)) ? { id, name: parsed.data } : null;
    });
    if (res === "taken") return fail("NAME_TAKEN", "name");
    if (!res) return fail("NOT_ALLOWED");
    revalidate();
    return ok(res);
  } catch {
    return fail("UNKNOWN");
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  if (!uuid.safeParse(id).success) return fail("NOT_ALLOWED");
  try {
    const res = await withTenant(tenantId, (tx) => removeCategory(tx, id));
    if (res === "not_empty") return fail("CATEGORY_NOT_EMPTY");
    if (res === "not_found") return fail("NOT_ALLOWED");
    revalidate();
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
