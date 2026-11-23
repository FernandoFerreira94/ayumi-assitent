import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { maskCep } from "@/features/salon/address";
import { AddressCard } from "@/features/salon/AddressCard";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Endereço do estúdio" };

/** Ajustes > Endereço: onde fica o estúdio (convite da cliente, Google e mensagens). Editar abre um sheet. */
export default async function EnderecoPage() {
  const { tenantId } = await requireTenant();
  // tenants não tem FORCE RLS; o filtro pelo estúdio vem do requireTenant
  const [t] = await getDb()
    .select({
      cep: tenants.addressCep,
      street: tenants.addressStreet,
      number: tenants.addressNumber,
      complement: tenants.addressComplement,
      district: tenants.addressDistrict,
      city: tenants.addressCity,
      state: tenants.addressState,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return (
    <PageShell back backHref="/ajustes" title="Endereço">
      <section id="endereco" aria-label="Endereço do estúdio" className="scroll-mt-6">
        <AddressCard
          initial={{
            cep: maskCep(t?.cep ?? ""),
            street: t?.street ?? "",
            number: t?.number ?? "",
            complement: t?.complement ?? "",
            district: t?.district ?? "",
            city: t?.city ?? "",
            state: t?.state ?? "",
          }}
        />
      </section>
    </PageShell>
  );
}
