import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import type { CatalogService } from "@/features/services/catalog";
import { doneInRange, listServices, upcomingByService } from "@/features/services/core";
import { salesByService } from "@/features/services/stats";
import { monthRange } from "@/features/finance/period";
import { todayStr } from "@/lib/dates";
import { connection } from "next/server";
import { ServicesCatalog } from "@/features/services/ServicesCatalog";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicosPage({ searchParams }: PageProps<"/servicos">) {
  await connection(); // "este mês" depende de hoje
  const { tenantId } = await requireTenant();
  const { novo } = await searchParams;
  const { range } = monthRange(todayStr().slice(0, 7));
  const services = await withTenant(tenantId, async (tx) => {
    const [rows, upcoming, done] = await Promise.all([listServices(tx), upcomingByService(tx), doneInRange(tx, range)]);
    const sales = salesByService(done);
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
      returnDays: s.returnDays,
      upcoming: upcoming.get(s.id) ?? 0,
      month: sales.get(s.id) ?? { count: 0, cents: 0 },
    }));
    return services;
  });

  return (
    <PageShell
      back
      wide
      title="Serviços"
      subtitle={services.length ? `${services.length} ${services.length === 1 ? "serviço" : "serviços"}` : undefined}
    >
      <ServicesCatalog services={services} startWithNew={novo === "1"} />
    </PageShell>
  );
}
