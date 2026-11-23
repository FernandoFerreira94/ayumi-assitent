"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { addressInput, cepDigits, formatAddress, fromViaCep, type StudioAddress } from "./address";

type CepResult = Omit<StudioAddress, "number" | "complement">;

/**
 * Busca o CEP no ViaCEP (gratuito, sem chave) pelo servidor: o navegador não precisa liberar outro domínio e só
 * quem está logado usa. Falhou ou demorou: a dona preenche à mão.
 */
export async function lookupCep(cep: string): Promise<ActionResult<CepResult>> {
  await requireTenant();
  const digits = cepDigits(String(cep ?? ""));
  if (digits.length !== 8) return fail("VALIDATION", "cep");
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(5000),
      cache: "force-cache",
    });
    if (res.status === 400) return fail("CEP_NOT_FOUND");
    if (!res.ok) return fail("CEP_FAILED");
    const found = fromViaCep(await res.json());
    return found ? ok(found) : fail("CEP_NOT_FOUND");
  } catch {
    return fail("CEP_FAILED");
  }
}

/** Salva o endereço do estúdio em campos e a linha pronta (`address`). O papel do app só lê `tenants`: grava pelo dono. */
export async function saveAddress(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { tenantId } = await requireTenant();
  const p = addressInput.safeParse({
    cep: form.get("cep") ?? "",
    street: form.get("street") ?? "",
    number: form.get("number") ?? "",
    complement: form.get("complement") ?? "",
    district: form.get("district") ?? "",
    city: form.get("city") ?? "",
    state: form.get("state") ?? "",
  });
  if (!p.success) return fail("VALIDATION", String(p.error.issues[0]?.path[0] ?? ""));
  const a = p.data;
  try {
    await getDb()
      .update(tenants)
      .set({
        address: formatAddress(a),
        addressCep: a.cep,
        addressStreet: a.street,
        addressNumber: a.number,
        addressComplement: a.complement || null,
        addressDistrict: a.district,
        addressCity: a.city,
        addressState: a.state,
      })
      .where(eq(tenants.id, tenantId));
    revalidatePath("/ajustes", "layout");
    return ok();
  } catch {
    return fail("UNKNOWN");
  }
}
