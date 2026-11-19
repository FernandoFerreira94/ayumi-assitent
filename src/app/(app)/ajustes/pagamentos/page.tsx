import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { getWalletSettings } from "@/features/wallet/core";
import { WalletSettingsForm } from "@/features/wallet/WalletSettingsForm";
import { requireTenant } from "@/lib/tenant";
import { and, asc, eq } from "drizzle-orm";
import { services } from "@/db/schema";
import { listTemplates } from "@/features/wallet/packages";
import { PackageTemplates } from "@/features/wallet/PackageSheets";
import { packagePreview, packagePrice } from "@/features/wallet/rules";
import { formatBRL } from "@/lib/dates";

export const metadata: Metadata = { title: "Pagamentos" };

/** Ajustes > Pagamentos: regras do dinheiro da cliente (sinal, cancelamento, falta, pacotes e Pix). */
export default async function PagamentosPage() {
  const { tenantId } = await requireTenant();
  const { settings, templates, svcs } = await withTenant(tenantId, async (tx) => ({
    settings: await getWalletSettings(tx),
    templates: await listTemplates(tx),
    svcs: await tx
      .select({ id: services.id, name: services.name, priceCents: services.priceCents })
      .from(services)
      .where(and(eq(services.active, true), eq(services.bookable, true)))
      .orderBy(asc(services.position), asc(services.name)),
  }));
  const days = settings.packageValidDays;
  const views = templates.map((t) => ({
    ...t,
    pricedCents: packagePrice(t, t.servicePriceCents),
    preview: packagePreview(
      t,
      { name: t.serviceName, priceCents: t.servicePriceCents },
      t.validDays ?? days,
      formatBRL,
    ),
  }));
  return (
    <PageShell back backHref="/ajustes" title="Pagamentos">
      <section id="pagamentos" aria-label="Pagamentos das clientes" className="scroll-mt-6">
        <WalletSettingsForm settings={settings} />
      </section>
      <section id="pacotes" aria-label="Pacotes à venda" className="mt-3 scroll-mt-6">
        <PackageTemplates templates={views} services={svcs} validDays={days} />
      </section>
    </PageShell>
  );
}
