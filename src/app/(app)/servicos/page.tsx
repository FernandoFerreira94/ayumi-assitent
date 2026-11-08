import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import type { CatalogService } from "@/features/services/catalog";
import { listCategories, listServices, upcomingByService } from "@/features/services/core";
import { ServicesCatalog } from "@/features/services/ServicesCatalog";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicosPage({ searchParams }: PageProps<"/servicos">) {
  const { tenantId } = await requireTenant();
  const { novo } = await searchParams;
  const { services, categories } = await withTenant(tenantId, async (tx) => {
    const [rows, cats, upcoming] = await Promise.all([listServices(tx), listCategories(tx), upcomingByService(tx)]);
    const services: CatalogService[] = rows.map((s) => ({
      id: s.id,
      name: s.name,
      categoryId: s.categoryId,
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
    return { services, categories: cats };
  });

  return (
    <PageShell
      title="Serviços"
      subtitle={services.length ? `${services.length} ${services.length === 1 ? "serviço" : "serviços"}` : undefined}
    >
      <ServicesCatalog services={services} categories={categories} startWithNew={novo === "1"} />
    </PageShell>
  );
}
