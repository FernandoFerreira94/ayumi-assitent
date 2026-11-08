import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getHours } from "@/features/hours/core";
import { HoursForm } from "@/features/hours/HoursForm";
import { PushToggle } from "@/features/push/PushToggle";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { listServices } from "@/features/services/core";
import { NewServiceForm } from "@/features/services/NewServiceForm";
import { InstallGuide } from "@/features/install/InstallGuide";
import { ReplayTourButton } from "@/features/tour/ReplayTourButton";
import { formatBRL } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import { whatsappState } from "@/features/shell/status";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const { tenantId } = await requireTenant();
  const { services, week } = await withTenant(tenantId, async (tx) => ({
    services: await listServices(tx),
    week: await getHours(tx),
  }));
  const wa = await whatsappState(tenantId);
  return (
    <PageShell title="Ajustes">
      <section aria-labelledby="servicos" className="grid gap-3">
        <h2 id="servicos" className="px-1 text-sm font-bold uppercase tracking-wide text-muted">
          Serviços
        </h2>
        {services.length === 0 ? (
          <p className="px-1 text-sm font-semibold text-muted">Nenhum serviço cadastrado. Use o formulário abaixo para adicionar o primeiro.</p>
        ) : (
          <ul className="grid gap-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between glass rounded-full px-5 py-3.5"
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
      <section id="whatsapp" aria-label="WhatsApp" className="mt-6 scroll-mt-6">
        <WhatsAppCard initial={wa} />
      </section>
      <section aria-label="Avisos" className="mt-6">
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </section>
      <section aria-label="Expediente" className="mt-6">
        <HoursForm week={week} />
      </section>
      <section aria-label="Tour e instalação" className="mt-6 grid gap-3">
        <InstallGuide />
        <ReplayTourButton />
      </section>
    </PageShell>
  );
}
