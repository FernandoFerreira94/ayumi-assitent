import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/ui/PageShell";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { LocationToggle } from "@/features/owner-notices/LocationToggle";
import { PushToggle } from "@/features/push/PushToggle";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Notificações" };

/** Ajustes > Notificações: avisos neste aparelho e a cidade (previsão do tempo e feriados do bom dia). */
export default async function NotificacoesPage() {
  const { tenantId } = await requireTenant();
  const [salon] = await getDb()
    .select({ city: tenants.city, state: tenants.state, locationSource: tenants.locationSource })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return (
    <PageShell back backHref="/ajustes" title="Notificações">
      <div className="grid gap-3">
        <section id="avisos-celular" aria-label="Notificação" className="scroll-mt-6">
          <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
        </section>
        <section id="localizacao" aria-label="Localização" className="scroll-mt-6">
          <LocationToggle
            source={salon?.locationSource ?? null}
            city={salon?.city ?? null}
            state={salon?.state ?? null}
          />
        </section>
      </div>
    </PageShell>
  );
}
