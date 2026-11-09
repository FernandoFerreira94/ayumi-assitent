import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import type { CatalogService } from "@/features/services/catalog";
import { listServices, upcomingByService } from "@/features/services/core";
import { ServicesCatalog } from "@/features/services/ServicesCatalog";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicosPage({ searchParams }: PageProps<"/servicos">) {
  const { tenantId } = await requireTenant();
  const { novo } = await searchParams;
  const services = await withTenant(tenantId, async (tx) => {
    const [rows, upcoming] = await Promise.all([listServices(tx), upcomingByService(tx)]);
    const services: CatalogService[] = rows.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
      priceFrom: s.priceFrom,
      bufferMin: s.bufferMin,
      color: s.color,
      notes: s.notes,
      bookable: s.bookable,
      showInSlots: s.showInSlots,
      upcoming: upcoming.get(s.id) ?? 0,
    }));
    return services;
  });

  return (
    <PageShell
      back
      title="Serviços"
      subtitle={services.length ? `${services.length} ${services.length === 1 ? "serviço" : "serviços"}` : undefined}
    >
      <ServicesCatalog services={services} startWithNew={novo === "1"} />
    </PageShell>
  );
}
