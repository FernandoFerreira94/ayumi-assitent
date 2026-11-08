import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { SalonForm } from "@/features/salon/SalonForm";
import type { BusinessType } from "@/features/salon/schema";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const { tenantId } = await requireTenant();
  const [t] = await getDb()
    .select({ name: tenants.name, businessType: tenants.businessType, reminderTemplate: tenants.reminderTemplate })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return (
    <PageShell title="Meu perfil">
      <SalonForm
        initial={{
          name: t?.name ?? "",
          businessType: (t?.businessType as BusinessType | null) ?? null,
          reminderTemplate: t?.reminderTemplate ?? null,
        }}
      />
    </PageShell>
  );
}
