import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const { tenantId } = await requireTenant();
  const [t] = await getDb().select().from(tenants).where(eq(tenants.id, tenantId));
  return (
    <PageShell title="Meu perfil">
      <ProfileForm
        profile={{
          name: t?.name ?? "",
          category: t?.category ?? null,
          address: t?.address ?? null,
          instagram: t?.instagram ?? null,
          msgConfirmation: t?.msgConfirmation ?? null,
          msgReminder: t?.msgReminder ?? null,
        }}
      />
    </PageShell>
  );
}
