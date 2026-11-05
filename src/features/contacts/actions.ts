"use server";

import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { GoogleAuthError } from "@/features/google/calendar";
import { googleAccessToken } from "@/features/google/server";
import { importClients, markExisting, type Preview } from "./core";
import { fetchGoogleContacts } from "./google";
import { parseContactsFile, type Parsed } from "./parse";
import { importInput, MAX_FILE_BYTES } from "./schema";

type PreviewResult = { list: Preview; ignored: number };

async function toPreview(tenantId: string, parsed: Parsed): Promise<ActionResult<PreviewResult>> {
  const list = await withTenant(tenantId, (tx) => markExisting(tx, parsed.candidates));
  return ok({ list, ignored: parsed.ignored });
}

export async function previewFromFile(fd: FormData): Promise<ActionResult<PreviewResult>> {
  const { tenantId } = await requireTenant();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("VALIDATION", "file");
  if (file.size > MAX_FILE_BYTES) return fail("IMAGE_TOO_LARGE", "file");
  try {
    return await toPreview(tenantId, parseContactsFile(file.name, await file.text()));
  } catch {
    return fail("UNKNOWN");
  }
}

export async function previewFromGoogle(): Promise<ActionResult<PreviewResult>> {
  const { tenantId } = await requireTenant();
  try {
    const token = await googleAccessToken(tenantId);
    if (!token) return fail("GOOGLE_EXPIRED");
    return await toPreview(tenantId, await fetchGoogleContacts(token));
  } catch (e) {
    return fail(e instanceof GoogleAuthError ? "GOOGLE_EXPIRED" : "NETWORK");
  }
}

export async function importSelected(raw: unknown): Promise<ActionResult<{ created: number; skipped: number }>> {
  const { tenantId } = await requireTenant();
  const p = importInput.safeParse(raw);
  if (!p.success) return fail("VALIDATION");
  try {
    const r = await withTenant(tenantId, (tx) => importClients(tx, tenantId, p.data));
    revalidatePath("/clientes");
    return ok(r);
  } catch {
    return fail("UNKNOWN");
  }
}
