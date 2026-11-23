"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { requireTenant } from "@/lib/tenant";
import { addressInput, cepDigits, formatAddress, fromBrasilApi, fromViaCep, type StudioAddress } from "./address";

type CepResult = Omit<StudioAddress, "number" | "complement">;

/**
 * Busca o CEP no ViaCEP e, se falhar, na BrasilAPI (gratuitos, sem chave), pelo servidor: o navegador não precisa
 * liberar outro domínio e só quem está logado usa. Falhou ou demorou: a dona preenche à mão.
 */
export async function lookupCep(cep: string): Promise<ActionResult<CepResult>> {
  await requireTenant();
  const digits = cepDigits(String(cep ?? ""));
  if (digits.length !== 8) return fail("VALIDATION", "cep");
  // ViaCEP primeiro; fora do ar ou lento, a BrasilAPI. Alguma dizendo "não existe" e nenhuma achando = não existe.
  const sources = [
    { url: `https://viacep.com.br/ws/${digits}/json/`, parse: fromViaCep },
    { url: `https://brasilapi.com.br/api/cep/v1/${digits}`, parse: fromBrasilApi },
  ];
  let notFound = 0;
  for (const s of sources) {
    try {
      const res = await fetch(s.url, { signal: AbortSignal.timeout(4000), cache: "force-cache" });
      if (res.status === 400 || res.status === 404) {
        notFound++;
        continue;
      }
      if (!res.ok) continue;
      const found = s.parse(await res.json());
      if (found) return ok(found);
      notFound++;
    } catch {
      // rede/timeout: tenta a próxima fonte
    }
  }
  return fail(notFound > 0 ? "CEP_NOT_FOUND" : "CEP_FAILED");
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
