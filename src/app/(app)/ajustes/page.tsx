import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getHours } from "@/features/hours/core";
import { HoursForm } from "@/features/hours/HoursForm";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { PushToggle } from "@/features/push/PushToggle";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { currentState } from "@/features/whatsapp/core";
import { listServices } from "@/features/services/core";
import { NewServiceForm } from "@/features/services/NewServiceForm";
import { formatBRL } from "@/lib/dates";
import { requireTenant } from "@/lib/tenant";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

async function waInitial(tenantId: string): Promise<"open" | "other" | "unavailable"> {
  const admin = adminFromEnv();
  if (!admin) return "unavailable";
  try {
    const [t] = await getDb().select({ i: tenants.whatsappInstance }).from(tenants).where(eq(tenants.id, tenantId));
    return (await currentState(admin, t?.i ?? null)) === "open" ? "open" : "other";
  } catch {
    return "unavailable";
  }
}

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const { tenantId } = await requireTenant();
  const { services, week } = await withTenant(tenantId, async (tx) => ({
    services: await listServices(tx),
    week: await getHours(tx),
  }));
  const wa = await waInitial(tenantId);
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
      <section aria-label="WhatsApp" className="mt-6">
        <WhatsAppCard initial={wa} />
      </section>
      <section aria-label="Avisos" className="mt-6">
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </section>
      <section aria-label="Expediente" className="mt-6">
        <HoursForm week={week} />
      </section>
    </PageShell>
  );
}
