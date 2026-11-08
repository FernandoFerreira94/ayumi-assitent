import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { listServices } from "@/features/services/core";
import { ServiceSheet } from "@/features/services/ServiceSheet";
import { formatBRL } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicosPage() {
  const { tenantId } = await requireTenant();
  const services = await withTenant(tenantId, (tx) => listServices(tx));

  return (
    <PageShell
      title="Serviços"
      subtitle={services.length ? `${services.length} ${services.length === 1 ? "cadastrado" : "cadastrados"}` : undefined}
    >
      {services.length === 0 ? (
        <EmptyState
          title="Nenhum serviço cadastrado"
          description="Cadastre o que você atende, com duração e valor, para agendar e mostrar vagas."
          action={<ServiceSheet />}
        />
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <ServiceSheet />
          </div>
          <ul className="grid gap-2">
            {services.map((s) => (
              <li key={s.id}>
                <ServiceSheet
                  service={s}
                  className="glass flex min-h-13 w-full items-center justify-between gap-3 rounded-full px-5 py-3.5 text-left"
                >
                  <span className="font-bold">{s.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-muted">
                    {s.durationMin} min · {formatBRL(s.priceCents)}
                  </span>
                </ServiceSheet>
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}
