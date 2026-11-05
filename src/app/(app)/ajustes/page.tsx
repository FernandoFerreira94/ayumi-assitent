import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getHours } from "@/features/hours/core";
import { HoursForm } from "@/features/hours/HoursForm";
import { listServices } from "@/features/services/core";
import { NewServiceForm } from "@/features/services/NewServiceForm";
import { formatBRL } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const { tenantId } = await requireTenant();
  const { services, week } = await withTenant(tenantId, async (tx) => ({
    services: await listServices(tx),
    week: await getHours(tx),
  }));
  return (
    <PageShell title="Ajustes">
      <section aria-labelledby="servicos" className="grid gap-3">
        <h2 id="servicos" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
          Serviços
        </h2>
        {services.length === 0 ? (
          <p className="px-1 text-sm font-semibold text-muted">Nenhum serviço ainda. Adicione o primeiro abaixo.</p>
        ) : (
          <ul className="grid gap-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3"
              >
                <span className="font-bold">{s.name}</span>
                <span className="text-sm font-semibold text-muted">
                  {s.durationMin} min · {formatBRL(s.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <NewServiceForm />
      </section>
      <section aria-label="Expediente" className="mt-6">
        <HoursForm week={week} />
      </section>
    </PageShell>
  );
}
